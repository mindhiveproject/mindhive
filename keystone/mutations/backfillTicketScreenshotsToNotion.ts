import { createHash, timingSafeEqual } from "crypto";
import { backfillScreenshotToNotion } from "../lib/notionMirror";

/**
 * Upload screenshots to Notion for tickets mirrored before screenshots were.
 *
 * Idempotent: a page that already carries an image is skipped, so this is safe
 * to re-run, and doubles as the catch-up if NOTION_MIRROR_SCREENSHOTS is ever
 * switched off and back on. Dry-run by default, like the repo's other
 * backfill* mutations.
 *
 * Accepts the shared TICKET_WEBHOOK_SECRET as an alternative to a session, so
 * it can be run from a terminal without logging in.
 */

function secretMatches(provided: string): boolean {
  const expected = process.env.TICKET_WEBHOOK_SECRET;
  if (!expected) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

async function backfillTicketScreenshotsToNotion(
  _root: unknown,
  { dryRun = true, secret }: { dryRun?: boolean; secret?: string },
  context: any
) {
  if (secret) {
    if (!secretMatches(secret)) throw new Error("Forbidden.");
  } else {
    const session = context.session;
    if (!session?.itemId) throw new Error("You must be signed in to run this mutation.");
    const profile = await context.query.Profile.findOne({
      where: { id: session.itemId },
      query: "permissions { canManageTickets }",
    });
    if (!(profile?.permissions || []).some((p: any) => p.canManageTickets)) {
      throw new Error("Forbidden: canManageTickets required.");
    }
  }

  const tickets = await context.sudo().query.Ticket.findMany({
    where: { notionPageId: { not: { equals: "" } } },
    query: "id title",
  });

  const results: string[] = [];
  for (const ticket of tickets) {
    try {
      const outcome = await backfillScreenshotToNotion(context, ticket.id, { dryRun });
      results.push(`${outcome}: ${ticket.title}`);
    } catch (error: any) {
      results.push(`failed: ${ticket.title} — ${error?.message ?? error}`);
    }
  }
  return { dryRun, results };
}

export default backfillTicketScreenshotsToNotion;
