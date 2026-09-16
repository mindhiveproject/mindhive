import { createHash, timingSafeEqual } from "crypto";
import { backfillSupportTicketsToNotion as backfill } from "../lib/notionMirror";

/**
 * Link support tickets saved on the platform before the Notion "Support
 * tickets" relation existed — run once after scripts/setup-notion-support-
 * relation.js — or while Notion was unreachable.
 *
 * Only ever adds links, so it is safe to re-run. Dry-run by default, like the
 * repo's other backfill* mutations. Accepts the shared TICKET_WEBHOOK_SECRET
 * as an alternative to a session, so it can be run from a terminal.
 */

function secretMatches(provided: string): boolean {
  const expected = process.env.TICKET_WEBHOOK_SECRET;
  if (!expected) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

async function backfillSupportTicketsToNotion(
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

  return { dryRun, results: await backfill(context, { dryRun }) };
}

export default backfillSupportTicketsToNotion;
