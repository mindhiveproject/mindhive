// One-shot: rewrite ProposalCard.settings.includeInReviewSteps to milestone keys.
//
// Cards carry a mix of legacy action card types (ACTION_SUBMIT), milestone
// keys (submitted_as_proposal), uppercase legacy keys and milestone ids,
// because the card editor writes keys while older cards kept ACTION_* values.
// Readers that compare raw values (e.g. the feedback center) then miss cards.
//
// Each value is resolved against the milestones of the card's own board
// (resolveMilestonesForBoard: global + its template's milestones), in the same
// order the frontend uses, and replaced with that milestone's key. Duplicates
// collapse; values that match no active milestone are kept and reported.
//
// Admin-only. Dry-run by default; pass dryRun:false to apply. Idempotent.
// Pages over boards: pass the returned nextSkip as `skip` until it reports done.
// Pass boardId to process a single board.
import resolveMilestonesForBoard from "./resolveMilestonesForBoard";

type BackfillArgs = {
  boardId?: string | null;
  limit?: number | null;
  skip?: number | null;
  dryRun?: boolean | null;
};

type MilestoneRow = {
  id: string;
  key: string;
  actionCardType?: string | null;
};

function parseSettings(settings: any) {
  if (!settings) return null;
  if (typeof settings === "string") {
    try {
      return JSON.parse(settings);
    } catch {
      return null;
    }
  }
  return typeof settings === "object" && !Array.isArray(settings)
    ? settings
    : null;
}

function findMilestone(step: unknown, milestones: MilestoneRow[]) {
  if (typeof step !== "string" || !step) return null;
  const lower = step.toLowerCase();
  return (
    milestones.find((m) => m.id === step) ||
    milestones.find((m) => m.key?.toLowerCase() === lower) ||
    milestones.find((m) => m.actionCardType === step) ||
    null
  );
}

export function normalizeSteps(steps: unknown[], milestones: MilestoneRow[]) {
  const next: unknown[] = [];
  const unresolved: unknown[] = [];
  for (const step of steps) {
    const milestone = findMilestone(step, milestones);
    if (!milestone) unresolved.push(step);
    const value = milestone ? milestone.key : step;
    if (!next.includes(value)) next.push(value);
  }
  return { next, unresolved };
}

export default async function backfillNormalizeReviewSteps(
  _root: unknown,
  args: BackfillArgs,
  context: any
): Promise<string[]> {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in.");
  }
  const profile = await context.query.Profile.findOne({
    where: { id: session.itemId },
    query: "permissions { canManageUsers }",
  });
  const isAdmin = (profile?.permissions || []).some(
    (p: any) => p.canManageUsers
  );
  if (!isAdmin) {
    throw new Error(
      "Forbidden: this backfill is admin-only (canManageUsers)."
    );
  }

  const limit = Math.min(Math.max(args?.limit ?? 200, 1), 2000);
  const skip = Math.max(args?.skip ?? 0, 0);
  const dryRun = args?.dryRun ?? true;
  const prefix = dryRun ? "[dry run] " : "";
  const log: string[] = [];

  const sudo = context.sudo();
  const boards = await sudo.query.ProposalBoard.findMany({
    where: args?.boardId ? { id: { equals: args.boardId } } : {},
    orderBy: [{ createdAt: "asc" }],
    take: args?.boardId ? 1 : limit,
    skip: args?.boardId ? 0 : skip,
    query: "id title sections { cards { id title settings } }",
  });

  let cardsChanged = 0;
  let cardsUnresolved = 0;

  for (const board of boards) {
    const cards = (board.sections || []).flatMap((s: any) => s.cards || []);
    const withSteps = cards
      .map((card: any) => ({ card, settings: parseSettings(card.settings) }))
      .filter(
        ({ settings }: any) =>
          Array.isArray(settings?.includeInReviewSteps) &&
          settings.includeInReviewSteps.length > 0
      );
    if (!withSteps.length) continue;

    const milestones = (await resolveMilestonesForBoard(
      null,
      { boardId: board.id },
      sudo
    )) as MilestoneRow[];

    const ambiguous = new Set<string>();
    const seenTypes = new Map<string, string>();
    for (const m of milestones) {
      if (!m.actionCardType) continue;
      if (seenTypes.has(m.actionCardType)) ambiguous.add(m.actionCardType);
      else seenTypes.set(m.actionCardType, m.key);
    }
    if (ambiguous.size) {
      log.push(
        `board ${board.id} "${board.title ?? ""}": several milestones share ${[
          ...ambiguous,
        ].join(", ")}; mapped to the first in board order (as the frontend does)`
      );
    }

    for (const { card, settings } of withSteps) {
      const steps = settings.includeInReviewSteps;
      const { next, unresolved } = normalizeSteps(steps, milestones);

      if (unresolved.length) {
        cardsUnresolved += 1;
        log.push(
          `board ${board.id} card ${card.id} "${card.title ?? ""}": kept unresolved ${JSON.stringify(
            unresolved
          )}`
        );
      }
      if (JSON.stringify(next) === JSON.stringify(steps)) continue;

      cardsChanged += 1;
      log.push(
        `${prefix}board ${board.id} card ${card.id} "${card.title ?? ""}": ${JSON.stringify(
          steps
        )} -> ${JSON.stringify(next)}`
      );
      if (!dryRun) {
        await sudo.db.ProposalCard.updateOne({
          where: { id: card.id },
          data: { settings: { ...settings, includeInReviewSteps: next } },
        });
      }
    }
  }

  const done = args?.boardId || boards.length < limit;
  log.unshift(
    `${prefix}Scanned ${boards.length} board(s) from skip=${skip}: ${cardsChanged} card(s) ${
      dryRun ? "to update" : "updated"
    }, ${cardsUnresolved} with unresolved values. ${
      done ? "Done." : `nextSkip=${skip + boards.length}`
    }`
  );

  return log;
}
