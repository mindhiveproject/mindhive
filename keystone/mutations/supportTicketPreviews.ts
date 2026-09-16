import { permissions } from "../access";
import { previewSupportTickets } from "../lib/notionMirror";

/**
 * What pasted support-ticket links point at: each one's title, and whether it
 * is really a page in the Support tickets database. Read-only. The ticket UI
 * calls it while a link is being pasted, and to label the ones already linked.
 *
 * Gated like the Ticket list itself. A support ticket can name the person who
 * wrote in, so only ticket managers may look one up through the platform.
 */

/** A ticket links a handful; this only bounds a runaway client. */
const MAX_LINKS = 20;

async function supportTicketPreviews(
  _root: unknown,
  { urls }: { urls: string[] },
  context: any
) {
  if (!permissions.canManageTickets({ session: context.session })) {
    throw new Error("Forbidden: canManageTickets required.");
  }
  return previewSupportTickets((urls ?? []).slice(0, MAX_LINKS));
}

export default supportTicketPreviews;
