import { createHash, timingSafeEqual } from "crypto";

/**
 * Read one ticket for a tool that has no session — the `/ticket` command in
 * Claude Code, or any future agent.
 *
 * Authenticated by the same shared secret as closeTicketsFromCommit, for the
 * same reason: a CLI has no cookie. Kept deliberately narrow — one ticket, by
 * id, read-only, and it cannot list or search. A leaked secret should not turn
 * into a way to enumerate the board.
 *
 * The screenshot is NOT returned, by design. A capture can contain student
 * names and responses; in the app it is gated behind canManageTickets and
 * pruned 90 days after resolution. Handing it to a tool that may forward it to
 * a model widens that audience with no expiry and no consent basis. Text-only
 * is the safe default, and the surface root plus the evidence are what actually
 * help locate a bug. `hasScreenshot` says one exists, so a human can open the
 * ticket and look at it under the original access rules.
 */

function secretMatches(provided: string): boolean {
  const expected = process.env.TICKET_WEBHOOK_SECRET;
  if (!expected) return false; // fail closed
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

async function ticketForAgent(
  _root: unknown,
  { secret, id }: { secret: string; id: string },
  context: any
) {
  if (!secretMatches(secret || "")) {
    throw new Error("Forbidden.");
  }

  const ticket = await context.sudo().query.Ticket.findOne({
    where: { id: String(id) },
    query: `
      id title surface kind status priority body evidence
      figmaDesignUrl figmaNodeId
      createdAt updatedAt resolvedAt notionPageId
      reporter { username }
      screenshot { id }
    `,
  });

  if (!ticket) return null;

  return {
    id: ticket.id,
    title: ticket.title,
    surface: ticket.surface,
    kind: ticket.kind,
    status: ticket.status,
    priority: ticket.priority,
    description: ticket.body?.text ?? null,
    evidence: ticket.evidence ?? null,
    // "" is how the column stores "no link"; tools should see null.
    figmaDesignUrl: ticket.figmaDesignUrl || null,
    figmaNodeId: ticket.figmaNodeId ?? null,
    reporter: ticket.reporter?.username ?? null,
    createdAt: ticket.createdAt ?? null,
    resolvedAt: ticket.resolvedAt ?? null,
    hasScreenshot: !!ticket.screenshot?.id,
  };
}

export default ticketForAgent;
