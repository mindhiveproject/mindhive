// Standalone collaborative-editing server (Yjs / Hocuspocus).
//
// This runs as its OWN process, separate from the Keystone API process, so that
// a Keystone restart / crash / rebuild can never drop collaboration sockets (and
// vice-versa). It talks to the same database directly via Prisma and reuses
// Keystone's session cookie (`keystonejs-session`, sealed with @hapi/iron +
// SESSION_SECRET) for auth — so no separate token or login is needed.
//
// It is intentionally plain CommonJS so it runs with a bare `node collab-server.js`
// (no TypeScript build step). Run it from the keystone/ directory so it resolves
// node_modules, the generated Prisma client, and the dev sqlite file.
//
// Architecture mirrors the in-process version it replaces: one Yjs document per
// ProposalCard (`proposalCard:<id>`), persisted as a base64 `yjsState` blob. No
// HTML conversion happens here (that needs a DOM) — the browser owns HTML.
//
// Required env (from keystone/.env, loaded below):
//   SESSION_SECRET   – same secret Keystone uses to seal the session cookie
//   DATABASE_URL     – production Postgres URL (Prisma reads this)
//   COLLAB_PORT      – optional, defaults to 4445
// For local dev against Keystone's sqlite, run with DATABASE_URL=file:./keystone.db


require("dotenv/config");

const http = require("http");
const { Hocuspocus } = require("@hocuspocus/server");
const { WebSocketServer } = require("ws");
const Y = require("yjs");
const Iron = require("@hapi/iron");
const { PrismaClient } = require("@prisma/client");

const PORT = Number(process.env.COLLAB_PORT || 4445);

// Prisma reads the datasource URL from DATABASE_URL (same as Keystone in
// production). For local dev, start this process with DATABASE_URL pointing at
// the same database Keystone uses (e.g. file:./keystone.db).
const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseCookies(cookieHeader) {
  const cookies = {};
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
  "#f97316",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#ef4444",
  "#ec4899",
  "#f59e0b",
  "#3b82f6",
];

function getUserColor(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

function cardIdFromName(documentName) {
  return documentName.replace("proposalCard:", "");
}

/**
 * Splits the document into name and ID. Has to be sent with ":" in-between
 * @param {string} documentName 
 * @returns {{name: string, id: string}} The parsed document name and ID
 */
function itemIdFromName(documentName) {
  const splitName = documentName.split(":");
  return { name: splitName[0], id: splitName[1] }
}

function displayName(profile) {
  if (!profile) return "Editor";
  const full = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  return full || profile.username || "Editor";
}

// ── Hocuspocus instance ──────────────────────────────────────────────────────

const hocuspocus = new Hocuspocus({
  // Persist after 2s of inactivity; force-flush after 30s.
  debounce: 2000,
  maxDebounce: 30000,

  async onAuthenticate({ requestHeaders, documentName, context }) {
    const cookieHeader = requestHeaders.cookie || "";
    const cookies = parseCookies(cookieHeader);
    const sessionCookie = cookies["keystonejs-session"];

    if (!sessionCookie) {
      throw new Error("Unauthorized: no session cookie");
    }
    if (!process.env.SESSION_SECRET) {
      console.error(
        "[collab] SESSION_SECRET is not set — cannot unseal the session cookie.",
      );
    }

    // Keystone statelessSessions seals the cookie with @hapi/iron (not JWT).
    let payload;
    try {
      payload = await Iron.unseal(
        sessionCookie,
        process.env.SESSION_SECRET,
        Iron.defaults,
      );
    } catch {
      throw new Error("Unauthorized: invalid session");
    }

    const profileId = payload && payload.itemId;
    if (!profileId) throw new Error("Unauthorized: missing profile id");

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { username: true, firstName: true, lastName: true },
    });

    // I think this is being set in the frontend? So we might be safe deleting it!
    context.user = {
      id: profileId,
      name: displayName(profile),
      color: getUserColor(profileId),
    };

    const itemInfo = itemIdFromName(documentName);

    const item = await prisma[itemInfo.name].findUnique({
      where: { id: itemInfo.id },
      select: { id: true },
    });

    if (!item) throw new Error("Access denied: item not found");
    

  },

  async onLoadDocument({ documentName, document }) {
    const item = itemIdFromName(documentName);
    const record = await prisma[item.name].findUnique({
      where: { id: item.id },
      select: { yjsState: true },
    });

    if (record && record.yjsState) {
      console.log("Loading document from yjs-state");
      Y.applyUpdate(document, Buffer.from(record.yjsState, "base64"));
    }
    // No yjsState yet: leave empty — the client seeds from HTML or other files
    
    return document;
  },

  async onStoreDocument({ documentName, document, context }) {
    const item = itemIdFromName(documentName);
    const state = Y.encodeStateAsUpdate(document);
    const yjsState = Buffer.from(state).toString("base64");

    const data = { yjsState };
    if (context.user && context.user.id) {
      data.isEditedById = context.user.id;
      data.lastTimeEdited = new Date();
    }

    console.log("Storing document changes");
    
    await prisma[item.name].update({ where: { id: item.id }, data });
  },
});

// ── HTTP + WebSocket server ──────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/collaboration/health") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
    return;
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
});

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws, request) => {
  ws.setMaxListeners(Number.POSITIVE_INFINITY);
  hocuspocus.handleConnection(ws, request);
});

server.on("upgrade", (request, socket, head) => {
  if (request.url && request.url.startsWith("/collaboration")) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`[collab] standalone collaboration server listening on :${PORT}`);
});

// A stray bad message/connection must never take the whole collab server down.
process.on("unhandledRejection", (reason) => {
  console.error(
    "[collab] unhandledRejection",
    reason instanceof Error ? `${reason.name}: ${reason.message}` : reason,
  );
});

async function shutdown(signal) {
  console.log(`[collab] ${signal} received, shutting down…`);
  try {
    await prisma.$disconnect();
  } catch {
    // ignore
  }
  server.close(() => process.exit(0));
  // Force-exit if connections keep the server open.
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
