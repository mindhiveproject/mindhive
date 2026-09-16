#!/usr/bin/env node
/**
 * Assemble everything known about one ticket, for the `/ticket` command.
 *
 * The expensive, error-prone part of fixing a reported bug is working out where
 * in 1,189 component files it lives. A ticket already answers that: it names a
 * surface, and the registry maps that surface to a directory. This prints the
 * ticket, the surface, and that directory's contents in one go.
 *
 *   node scripts/ticket-context.mjs <ticket-id>
 *
 * Auth: TICKET_WEBHOOK_SECRET, the same shared secret CI uses — a CLI has no
 * session cookie. Read from keystone/.env if not already in the environment.
 * BACKEND overrides the endpoint (defaults to local dev).
 *
 * The screenshot is never fetched. It can contain student names and responses;
 * the backend deliberately returns only whether one exists.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(ROOT, "..");

function fail(message, hint) {
  console.error(`\n✗ ${message}`);
  if (hint) console.error(`  ${hint}`);
  process.exit(1);
}

/** Read one key out of an .env file without pulling in a dependency. */
function fromEnvFile(file, key) {
  if (!existsSync(file)) return null;
  const line = readFileSync(file, "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "") : null;
}

const id = process.argv[2];
if (!id) fail("No ticket id.", "Usage: node scripts/ticket-context.mjs <ticket-id>");

const secret =
  process.env.TICKET_WEBHOOK_SECRET ||
  fromEnvFile(join(REPO, "keystone", ".env"), "TICKET_WEBHOOK_SECRET");

if (!secret) {
  fail(
    "TICKET_WEBHOOK_SECRET is not set.",
    "Add it to keystone/.env (it is the same secret the CI workflows use)."
  );
}

const endpoint = process.env.BACKEND || "http://localhost:4444/api/graphql";

const QUERY = `
  query($secret: String!, $id: ID!) {
    ticketForAgent(secret: $secret, id: $id) {
      id title surface kind status priority description evidence
      figmaDesignUrl figmaNodeId reporter createdAt resolvedAt hasScreenshot
    }
  }
`;

let payload;
try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { secret, id } }),
    signal: AbortSignal.timeout(10000),
  });
  payload = await response.json();
} catch (reason) {
  fail(`Could not reach ${endpoint} — ${reason.message}`, "Is the backend running?");
}

if (payload.errors?.length) {
  const message = payload.errors[0].message;
  fail(
    `Backend refused the request: ${message}`,
    message === "Forbidden."
      ? "TICKET_WEBHOOK_SECRET here does not match the backend's."
      : undefined
  );
}

const ticket = payload.data?.ticketForAgent;
if (!ticket) fail(`No ticket with id ${id}.`);

/* ---- the surface ------------------------------------------------------- */

// Loaded as a data: URL, matching check-surfaces.mjs — lib/surfaces.js is ESM
// but the package has no "type": "module", so importing it by path warns on
// every run. The module has no imports of its own, so this is equivalent.
const surfacesSrc = readFileSync(join(ROOT, "lib", "surfaces.js"), "utf8");
const { getSurface } = await import(
  `data:text/javascript;base64,${Buffer.from(surfacesSrc).toString("base64")}`
);
const surface = getSurface(ticket.surface);

function listFiles(root) {
  const candidates = [root, `${root}.js`, `${root}.tsx`, `${root}.jsx`];
  const found = candidates.find((c) => existsSync(join(ROOT, c)));
  if (!found) return null;

  const full = join(ROOT, found);
  if (statSync(full).isFile()) return [found];

  const out = [];
  const walk = (dir, rel) => {
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry);
      const next = `${rel}/${entry}`;
      if (statSync(abs).isDirectory()) walk(abs, next);
      else if (/\.(js|jsx|ts|tsx|css)$/.test(entry)) out.push(next);
    }
  };
  walk(full, found);
  return out;
}

/* ---- print ------------------------------------------------------------- */

const line = "─".repeat(72);
const say = (label, value) =>
  value != null && value !== "" && console.log(`  ${label.padEnd(12)} ${value}`);

console.log(`\n${line}\n  ${ticket.title}\n${line}`);
say("id", ticket.id);
say("status", `${ticket.status}   kind: ${ticket.kind}   priority: ${ticket.priority}`);
say("surface", `${ticket.surface}${surface ? `  — ${surface.label}` : "  (NOT IN THE REGISTRY)"}`);
say("reporter", ticket.reporter);
say("filed", ticket.createdAt);
say("resolved", ticket.resolvedAt);
say("design", ticket.figmaDesignUrl);
say("captured", ticket.figmaNodeId);
say("screenshot", ticket.hasScreenshot ? `yes — view at /dashboard/tickets/${ticket.id}` : null);

if (ticket.description) {
  console.log(`\n  What should happen\n${line}`);
  console.log(ticket.description.split("\n").map((l) => `  ${l}`).join("\n"));
}

if (ticket.evidence && Object.keys(ticket.evidence).length) {
  console.log(`\n  Evidence at filing time\n${line}`);
  for (const [key, value] of Object.entries(ticket.evidence)) {
    const shown = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
    console.log(`  ${key.padEnd(12)} ${shown}`);
  }
}

console.log(`\n  Where to look\n${line}`);
if (!surface) {
  console.log(`  The surface "${ticket.surface}" is not in lib/surfaces.js.`);
  console.log(`  Either it was renamed, or the ticket predates a registry change.`);
} else {
  say("routes", surface.routes?.join(", "));
  say("root", surface.root);
  const files = listFiles(surface.root);
  if (!files) {
    console.log(`\n  ⚠ ${surface.root} does not exist — the registry is stale here.`);
  } else {
    console.log(`\n  ${files.length} file(s) under that root:`);
    for (const file of files.slice(0, 40)) console.log(`    frontend/${file}`);
    if (files.length > 40) console.log(`    … and ${files.length - 40} more`);
  }
}

console.log(`\n  Close it with:  Fixes-Ticket: ${ticket.id}\n`);
