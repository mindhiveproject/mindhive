// Collaborative editing backend for ProposalCard rich-text fields.
//
// Architecture: the server is a thin, DOM-free Yjs persistence + auth layer.
//   • One Yjs document per ProposalCard, named `proposalCard:<id>`.
//   • onLoadDocument restores the document from the persisted `yjsState` blob.
//   • onStoreDocument writes the `yjsState` blob back (plus edit metadata).
//
// IMPORTANT: no HTML <-> Yjs conversion happens here. Converting ProseMirror
// content to/from HTML needs a DOM, and the only Node DOM @tiptap/html supports
// (happy-dom) is ESM-only, which breaks Keystone's CommonJS build. So the client
// (which already has a real browser DOM and the editor) owns HTML:
//   • it seeds an empty shared document from the existing HTML on first open;
//   • it mirrors the editor HTML back into the ProposalCard columns on save.
// The server is the single source of truth for the collaborative `yjsState`.
//
// Auth reuses Keystone's stateless session cookie (`keystonejs-session`), sealed
// with @hapi/iron + SESSION_SECRET — the same mechanism Keystone uses — so the
// WebSocket upgrade needs no separate token.

import { Hocuspocus } from "@hocuspocus/server";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import Iron from "@hapi/iron";
import type { IncomingMessage } from "http";
import type { Duplex } from "stream";

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

      if (record?.yjsState) {
        const update = Buffer.from(record.yjsState as string, "base64");
        Y.applyUpdate(document as unknown as Y.Doc, update);
      }
      // No yjsState yet: leave the document empty. The client seeds it from the
      // card's existing HTML once it connects (browser-side, where a DOM exists).

      return document;
    },

    // ── Store ─────────────────────────────────────────────────────────────
    async onStoreDocument({ documentName, document, context }) {
      const cardId = cardIdFromName(documentName);
      const state = Y.encodeStateAsUpdate(document as unknown as Y.Doc);
      const yjsState = Buffer.from(state).toString("base64");

      const data: Record<string, unknown> = { yjsState };
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
