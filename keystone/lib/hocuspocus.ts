// Collaborative editing backend for ProposalCard rich-text fields.
//
// Architecture (Option B — Yjs is the live source of truth, HTML is mirrored):
//   • One Yjs document per ProposalCard, named `proposalCard:<id>`.
//   • Each editable rich-text field (description, content, comment) lives in a
//     named Yjs XML fragment whose name equals the field name.
//   • onLoadDocument seeds fragments from the persisted yjsState blob, or — for
//     a card that has never been edited collaboratively — from the existing HTML
//     fields, so propagation/copy results show up on first open.
//   • onStoreDocument serialises every fragment back to HTML and writes both the
//     HTML fields and the base64 yjsState blob, so all the existing read-only /
//     export / propagation flows keep reading current HTML with no changes.
//
// Auth reuses Keystone's stateless session cookie (`keystonejs-session`), sealed
// with @hapi/iron + SESSION_SECRET — the same mechanism Keystone uses — so the
// WebSocket upgrade needs no separate token.

import { Hocuspocus } from "@hocuspocus/server";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import Iron from "@hapi/iron";
import { getSchema } from "@tiptap/core";
import { generateHTML, generateJSON } from "@tiptap/html";
import {
  prosemirrorJSONToYXmlFragment,
  yXmlFragmentToProsemirrorJSON,
} from "y-prosemirror";
import type { IncomingMessage } from "http";
import type { Duplex } from "stream";

import {
  tiptapServerExtensions,
  COLLAB_FIELDS,
} from "./tiptapServerExtensions";

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const name = part.slice(0, idx).trim();
    const value = decodeURIComponent(part.slice(idx + 1).trim());
    cookies[name] = value;
  });
  return cookies;
}

const CURSOR_COLORS = [
  "#f97316", // orange
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#ef4444", // red
  "#ec4899", // pink
  "#f59e0b", // amber
  "#3b82f6", // blue
];

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

function cardIdFromName(documentName: string): string {
  return documentName.replace("proposalCard:", "");
}

function displayName(profile: any): string {
  if (!profile) return "Editor";
  const full = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  return full || profile.username || "Editor";
}

// Build the ProseMirror schema once — needed to turn HTML/JSON into Yjs fragments.
const pmSchema = getSchema(tiptapServerExtensions as any);

// An empty editor serialises to "<p></p>"; treat that (and "") as empty so we
// don't gratuitously rewrite untouched fields.
function isEmptyHtml(html: string | null | undefined): boolean {
  return !html || html === "<p></p>";
}

// ── Server factory ───────────────────────────────────────────────────────────
//
// Returns a `handleUpgrade` function to attach to Keystone's HTTP server.
// Hocuspocus v3: `new Hocuspocus(config)` + a WebSocketServer in noServer mode.

export function createHocuspocusServer(commonContext: any) {
  const hocuspocus = new Hocuspocus({
    // Persist after 2s of inactivity; force-flush after 30s.
    debounce: 2000,
    maxDebounce: 30000,

    // ── Auth ──────────────────────────────────────────────────────────────
    async onAuthenticate({ requestHeaders, documentName, context }) {
      const cookieHeader =
        (requestHeaders as Record<string, string>).cookie ?? "";
      const cookies = parseCookies(cookieHeader);
      const sessionCookie = cookies["keystonejs-session"];

      if (!sessionCookie) {
        throw new Error("Unauthorized: no session cookie");
      }

      if (!process.env.SESSION_SECRET) {
        console.error(
          "[collab] SESSION_SECRET is not set in the backend env — WS auth cannot unseal the session cookie.",
        );
      }

      // Keystone statelessSessions seals the cookie with @hapi/iron (not JWT).
      let payload: any;
      try {
        payload = await Iron.unseal(
          sessionCookie,
          process.env.SESSION_SECRET!,
          Iron.defaults,
        );
      } catch {
        throw new Error("Unauthorized: invalid session");
      }

      const profileId = payload?.itemId as string;
      if (!profileId) throw new Error("Unauthorized: missing profile id");

      const cardId = cardIdFromName(documentName);
      const sudoCtx = commonContext.sudo();

      // First-pass access: the card must exist. ProposalCard list access is
      // currently operation-level open; tighten here (author/collaborator only)
      // once that is the desired policy.
      const card = await sudoCtx.db.ProposalCard.findOne({
        where: { id: cardId },
      });
      if (!card) throw new Error("Access denied: card not found");

      const profile = await sudoCtx.db.Profile.findOne({
        where: { id: profileId },
      });

      context.user = {
        id: profileId,
        name: displayName(profile),
        color: getUserColor(profileId),
      };
    },

    // ── Load ──────────────────────────────────────────────────────────────
    async onLoadDocument({ documentName, document }) {
      const cardId = cardIdFromName(documentName);
      const sudoCtx = commonContext.sudo();

      const record = await sudoCtx.db.ProposalCard.findOne({
        where: { id: cardId },
      });

      const ydoc = document as unknown as Y.Doc;

      // Resume from the durable CRDT state, if any.
      if (record?.yjsState) {
        const update = Buffer.from(record.yjsState as string, "base64");
        Y.applyUpdate(ydoc, update);
      }

      // Backfill any still-empty fragment from the current HTML. This covers two
      // cases safely and idempotently:
      //   • first-ever open (no yjsState): seed all fields from HTML, so existing
      //     content — incl. anything just propagated/copied — is preserved;
      //   • a field added to COLLAB_FIELDS after this card already had yjsState:
      //     seed just that field rather than letting onStore overwrite its HTML
      //     with an empty string.
      // A fragment that is legitimately empty because the user cleared it has an
      // empty HTML mirror too (isEmptyHtml), so it is not re-seeded.
      for (const field of COLLAB_FIELDS) {
        if (ydoc.getXmlFragment(field).length > 0) continue;
        const html = (record as any)?.[field] as string | undefined;
        if (isEmptyHtml(html)) continue;
        try {
          const json = generateJSON(html as string, tiptapServerExtensions as any);
          prosemirrorJSONToYXmlFragment(
            pmSchema,
            json,
            ydoc.getXmlFragment(field),
          );
        } catch (err) {
          console.error(
            `[collab] failed to seed fragment "${field}" for card ${cardId}:`,
            err instanceof Error ? err.message : err,
          );
        }
      }

      return document;
    },

    // ── Store ─────────────────────────────────────────────────────────────
    async onStoreDocument({ documentName, document, context }) {
      const cardId = cardIdFromName(documentName);
      const ydoc = document as unknown as Y.Doc;

      const state = Y.encodeStateAsUpdate(ydoc);
      const yjsState = Buffer.from(state).toString("base64");

      const data: Record<string, unknown> = { yjsState };

      // Mirror each fragment back into its HTML field.
      for (const field of COLLAB_FIELDS) {
        try {
          const json = yXmlFragmentToProsemirrorJSON(ydoc.getXmlFragment(field));
          const html = generateHTML(json, tiptapServerExtensions as any);
          data[field] = isEmptyHtml(html) ? "" : html;
        } catch (err) {
          console.error(
            `[collab] failed to serialise fragment "${field}" for card ${cardId}:`,
            err instanceof Error ? err.message : err,
          );
        }
      }

      if (context.user?.id) {
        data.isEditedBy = { connect: { id: context.user.id } };
        data.lastTimeEdited = new Date().toISOString();
      }

      const sudoCtx = commonContext.sudo();
      await sudoCtx.db.ProposalCard.updateOne({
        where: { id: cardId },
        data,
      });
    },
  });

  // WebSocket server in noServer mode — we hand off upgrade requests ourselves.
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws: any, request: IncomingMessage) => {
    ws.setMaxListeners(Number.POSITIVE_INFINITY);
    hocuspocus.handleConnection(ws, request);
  });

  function handleUpgrade(
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ) {
    wss.handleUpgrade(request, socket as any, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  }

  return { handleUpgrade };
}
