import { createHash, timingSafeEqual } from "crypto";
import { readdir, stat, unlink } from "fs/promises";
import path from "path";
import { removeScreenshotFromNotion } from "../lib/notionMirror";

// Deletes filing-time screenshots once their ticket has been resolved long
// enough, so captures of live classes and boards do not accumulate forever.
//
// A capture can contain student names, responses and consent state. The
// overlay already refuses to capture on participant-facing surfaces, but a
// teacher's class page or a proposal board legitimately shows student work, so
// the remaining images need an expiry rather than indefinite retention.
//
// Clearing the field is enough to remove the file: the local storage buckets in
// keystone.ts do not set `preserve`, so the image field's own beforeOperation
// hook deletes the file when its value is set to null (checked against a real
// upload, not only the docs).
//
// It also sweeps files nothing refers to. The image field writes the file
// while it resolves its input — before the list's hooks and validation run —
// so a create that is then rejected (a bad Figma link, say) leaves its upload
// on disk with no row pointing at it, still public by URL and out of reach of
// the 90-day rule above. Only files older than a day are swept, so an upload
// whose row has not landed yet is never mistaken for one.
//
// Dry-run by default. Pass dryRun: false to delete. Idempotent.
//
// Two ways in. An admin with canManageTickets can run it from the Admin UI or
// Apollo sandbox; a scheduled job passes the same shared secret CI uses for
// closeTicketsFromCommit, because cron has no session. Retention that depends
// on someone remembering to click a button is not retention.
//
// Retention is also stated to the user in the frontend's
// Dashboard/Tickets/TicketPage.js caption — keep the two in step.

/** Days after a ticket is resolved before its screenshot is removed. */
export const SCREENSHOT_RETENTION_DAYS = 90;

const RESOLVED_STATUSES = ["SHIPPED", "WONTFIX"];

/** Mirrors `storagePath` for ticketScreenshots in keystone.ts. */
const SCREENSHOT_DIR = "ticket-screenshots";

/** An unreferenced file younger than this may belong to a write still in flight. */
const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000;

/**
 * Only names the bucket's own transformName produces — YYYY/MM/<ts>-<rand>.<ext>
 * — are ever swept, so nothing else that finds its way into the folder is at
 * risk, and a path built from a match cannot climb out of it.
 */
const BUCKET_FILE = /^\d{4}\/\d{2}\/\d+-[a-z0-9]+\.[a-z0-9]+$/;

/** Every file under `dir`, as "/"-separated paths relative to it. */
async function listFiles(dir: string, prefix = ""): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path.join(dir, entry.name), relative)));
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }
  return files;
}

/** Files in the bucket that no ticket screenshot or markup refers to. */
async function findOrphanedFiles(context: any): Promise<string[]> {
  const root = path.join(process.cwd(), SCREENSHOT_DIR);
  let files: string[];
  try {
    files = await listFiles(root);
  } catch (error: any) {
    if (error?.code === "ENOENT") return []; // nothing has been uploaded yet
    throw error;
  }

  const [tickets, annotations] = await Promise.all([
    context.sudo().query.Ticket.findMany({ query: "screenshot { id extension }" }),
    context.sudo().query.TicketAnnotation.findMany({ query: "image { id extension }" }),
  ]);
  const referenced = new Set(
    [
      ...tickets.map((ticket: any) => ticket.screenshot),
      ...annotations.map((annotation: any) => annotation.image),
    ]
      .filter((image: any) => image?.id)
      .map((image: any) => `${image.id}.${image.extension}`)
  );

  const cutoff = Date.now() - ORPHAN_GRACE_MS;
  const orphans: string[] = [];
  for (const file of files) {
    if (!BUCKET_FILE.test(file) || referenced.has(file)) continue;
    const { mtimeMs } = await stat(path.join(root, file));
    if (mtimeMs < cutoff) orphans.push(file);
  }
  return orphans.sort();
}

function secretMatches(provided: string): boolean {
  const expected = process.env.TICKET_WEBHOOK_SECRET;
  if (!expected) return false; // fail closed
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

async function pruneTicketScreenshots(
  root: any,
  { dryRun = true, secret }: { dryRun?: boolean; secret?: string },
  context: any
) {
  // A valid shared secret stands in for a session, for the scheduled run.
  if (secret) {
    if (!secretMatches(secret)) {
      throw new Error("Forbidden.");
    }
  } else {
    const session = context.session;
    if (!session?.itemId) {
      throw new Error("You must be signed in to run this mutation.");
    }
    const profile = await context.query.Profile.findOne({
      where: { id: session.itemId },
      query: "permissions { canManageTickets }",
    });
    const canManage = (profile?.permissions || []).some(
      (p: any) => p.canManageTickets
    );
    if (!canManage) {
      throw new Error("Forbidden: canManageTickets required.");
    }
  }

  const cutoff = new Date(
    Date.now() - SCREENSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  // Only resolved tickets, and only ones that still carry an image. `resolvedAt`
  // is cleared when a ticket is reopened, so a reopened ticket can never match
  // and its evidence survives.
  const candidates = await context.sudo().query.Ticket.findMany({
    where: {
      status: { in: RESOLVED_STATUSES },
      resolvedAt: { lt: cutoff },
    },
    query:
      "id title surface resolvedAt notionPageId screenshot { id } annotations { id image { id } }",
  });

  // A markup holds the same pixels as the screenshot, so it expires with it.
  const stale = candidates.filter(
    (ticket: any) =>
      ticket.screenshot?.id || (ticket.annotations ?? []).some((a: any) => a.image?.id)
  );

  if (!dryRun) {
    for (const ticket of stale) {
      if (ticket.screenshot?.id) {
        await context.sudo().query.Ticket.updateOne({
          where: { id: ticket.id },
          data: { screenshot: null },
        });
      }
      // The note and the author stay — a record of who said what — but the
      // image goes, with the screenshot it was drawn on.
      for (const annotation of ticket.annotations ?? []) {
        if (!annotation.image?.id) continue;
        await context.sudo().query.TicketAnnotation.updateOne({
          where: { id: annotation.id },
          // Its Notion block goes in the page-wide removal below.
          data: { image: null, notionBlockId: "" },
        });
      }
      // The mirror uploaded a copy into Notion; expire it on the same
      // schedule, or the 90-day promise only holds for half the copies.
      // Best-effort — a Notion failure must not stop the local prune.
      await removeScreenshotFromNotion(ticket.notionPageId);
    }
  }

  // After the prune, so the files it just released are not counted twice.
  const orphans = await findOrphanedFiles(context);
  if (!dryRun) {
    const root = path.join(process.cwd(), SCREENSHOT_DIR);
    for (const file of orphans) {
      await unlink(path.join(root, file));
    }
  }

  return {
    dryRun,
    retentionDays: SCREENSHOT_RETENTION_DAYS,
    cutoff,
    prunedCount: stale.length,
    pruned: stale.map(
      (ticket: any) => `${ticket.surface}: ${ticket.title} (resolved ${ticket.resolvedAt})`
    ),
    orphanCount: orphans.length,
    orphans,
  };
}

export default pruneTicketScreenshots;
