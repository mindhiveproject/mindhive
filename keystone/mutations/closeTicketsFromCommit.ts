import { createHash, timingSafeEqual } from "node:crypto";

// Closes tickets named by a commit trailer, so the board decays in step with
// the work instead of being tidied by hand.
//
// Notion did not drift because Notion is bad. It drifted because filing was
// easy and closing was somebody's discretionary chore. An in-app widget makes
// filing easier still, so without an exit path it builds the same graveyard
// faster. A trailer is cheap to write at the one moment the author already
// knows the answer:
//
//     Fixes-Ticket: cmf3x9k2p0001
//
// Called by .github/workflows/close-tickets.yml on push to the default branch.
//
// AUTHENTICATION
//
// CI has no session, so this is gated by a shared secret rather than by
// `context.session`. That makes it the one mutation reachable without a login,
// so it is deliberately narrow:
//
//   - fails closed when TICKET_WEBHOOK_SECRET is unset, rather than allowing
//     anonymous calls in an environment that forgot to configure it
//   - compares with timingSafeEqual over fixed-length digests
//   - the only state change it can make is OPEN/ACCEPTED/IN_PROGRESS -> SHIPPED
//     on a ticket named by id. It cannot create, delete, reopen, or edit
//     anything else
//
// WHY THERE IS NO `Fixes-Surface`
//
// The plan also proposed closing every open ticket on a named surface. That is
// too blunt: a surface routinely carries several unrelated tickets, and a
// commit that fixes one of them would silently close the rest. Over-closing
// destroys trust in the board faster than under-closing, so a commit has to
// name the ticket it actually fixes.

const CLOSEABLE = ["OPEN", "ACCEPTED", "IN_PROGRESS"];

/** `Fixes-Ticket: <id>` — one per line, case-insensitive on the key. */
const TRAILER = /^\s*Fixes-Ticket:\s*([A-Za-z0-9_-]+)\s*$/gim;

function secretMatches(provided: string): boolean {
  const expected = process.env.TICKET_WEBHOOK_SECRET;
  if (!expected) return false; // fail closed
  // Hash both sides so timingSafeEqual gets equal-length buffers regardless of
  // what was sent, and a length mismatch is not itself a signal.
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

type Commit = { sha?: string; message?: string };

async function closeTicketsFromCommit(
  root: any,
  { secret, commits }: { secret: string; commits: Commit[] },
  context: any
) {
  if (!secretMatches(secret || "")) {
    throw new Error("Forbidden.");
  }

  const requested = new Map<string, string[]>(); // ticket id -> shas naming it
  for (const commit of commits || []) {
    const message = commit?.message ?? "";
    const sha = commit?.sha ?? "unknown";
    for (const match of message.matchAll(TRAILER)) {
      const id = match[1];
      if (!requested.has(id)) requested.set(id, []);
      requested.get(id)!.push(sha);
    }
  }

  const closed: string[] = [];
  const skipped: string[] = [];

  for (const [id, shas] of requested) {
    const ticket = await context.sudo().query.Ticket.findOne({
      where: { id },
      query: "id title status evidence",
    });

    if (!ticket) {
      skipped.push(`${id}: no such ticket`);
      continue;
    }
    if (!CLOSEABLE.includes(ticket.status)) {
      skipped.push(`${id}: already ${ticket.status}`);
      continue;
    }

    // Keep the shas that closed it, so a resolved ticket points back at the
    // change that resolved it.
    const evidence = {
      ...(ticket.evidence ?? {}),
      commits: [...((ticket.evidence?.commits as string[]) ?? []), ...shas],
    };

    await context.sudo().query.Ticket.updateOne({
      where: { id },
      data: { status: "SHIPPED", evidence },
    });
    closed.push(`${id}: ${ticket.title}`);
  }

  return { closed, skipped };
}

export default closeTicketsFromCommit;
