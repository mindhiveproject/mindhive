// Backfill ProposalBoard.milestoneStatus from legacy board columns (and
// linked Study columns for study-scoped milestones).
import {
  MILESTONE_SEEDS,
  type MilestoneSeed,
} from "./seedData/milestoneSeed";

type BackfillArgs = {
  limit?: number;
  dryRun?: boolean;
};

type MilestoneStatusEntry = {
  status: string;
  openForComments?: boolean;
  openForParticipation?: boolean;
};

type MilestoneStatusMap = Record<string, MilestoneStatusEntry>;

type BoardRow = {
  id: string;
  milestoneStatus?: MilestoneStatusMap | null;
  submitProposalStatus?: string | null;
  submitProposalOpenForComments?: boolean | null;
  peerFeedbackStatus?: string | null;
  peerFeedbackOpenForComments?: boolean | null;
  projectReportStatus?: string | null;
  projectReportOpenForComments?: boolean | null;
  study?: {
    dataCollectionStatus?: string | null;
    dataCollectionOpenForParticipation?: boolean | null;
  } | null;
};

function hasMilestoneStatus(data: unknown): boolean {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  return Object.keys(data as Record<string, unknown>).length > 0;
}

function readBoardField(board: BoardRow, fieldName?: string): unknown {
  if (!fieldName) return undefined;
  return (board as Record<string, unknown>)[fieldName];
}

function buildEntryForSeed(
  board: BoardRow,
  seed: MilestoneSeed
): MilestoneStatusEntry {
  if (seed.statusTarget === "study") {
    const study = board.study;
    const status = study?.dataCollectionStatus;
    return {
      status: typeof status === "string" ? status : "NOT_STARTED",
      openForParticipation: !!study?.dataCollectionOpenForParticipation,
    };
  }

  const status = readBoardField(board, seed.legacyBoardStatusField);
  const openForComments = readBoardField(board, seed.legacyOpenForCommentsField);

  return {
    status: typeof status === "string" ? status : "NOT_STARTED",
    openForComments: !!openForComments,
  };
}

function buildMilestoneStatus(board: BoardRow): MilestoneStatusMap {
  const result: MilestoneStatusMap = {};
  for (const seed of MILESTONE_SEEDS) {
    result[seed.key] = buildEntryForSeed(board, seed);
  }
  return result;
}

function milestoneStatusChanged(
  current: MilestoneStatusMap | null | undefined,
  next: MilestoneStatusMap
): boolean {
  return JSON.stringify(current || {}) !== JSON.stringify(next);
}

export default async function backfillMilestoneStatus(
  _root: unknown,
  args: BackfillArgs,
  context: any
): Promise<number> {
  const limit = Math.min(Math.max(args?.limit ?? 200, 1), 1000);
  const dryRun = args?.dryRun ?? false;

  const boards = (await context.sudo().query.ProposalBoard.findMany({
    take: limit,
    query: `
      id
      milestoneStatus
      submitProposalStatus
      submitProposalOpenForComments
      peerFeedbackStatus
      peerFeedbackOpenForComments
      projectReportStatus
      projectReportOpenForComments
      study {
        dataCollectionStatus
        dataCollectionOpenForParticipation
      }
    `,
  })) as BoardRow[];

  let updated = 0;

  for (const board of boards || []) {
    if (!board?.id) continue;
    if (hasMilestoneStatus(board.milestoneStatus)) continue;

    const milestoneStatus = buildMilestoneStatus(board);
    if (!milestoneStatusChanged(board.milestoneStatus, milestoneStatus)) {
      continue;
    }

    if (!dryRun) {
      await context.db.ProposalBoard.updateOne({
        where: { id: board.id },
        data: { milestoneStatus },
      });
    }
    updated += 1;
  }

  return updated;
}
