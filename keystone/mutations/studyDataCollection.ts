// studyDataCollection (query) and setStudyDataCollection (mutation): a
// study's data-collection state and the one way to change it. See
// lib/studyDataCollection.js for the rules.
import { isAdmin, studyUpdateWhere } from "../access";
import resolveMilestonesForBoard from "./resolveMilestonesForBoard";

const {
  TRUSTED_SESSION_FLAG,
  isStudyMilestone,
  summarizeStudy,
  planAction,
  buildWrites,
  logEventFor,
  logContent,
  historyEvents,
  summarizeHistory,
} = require("../lib/studyDataCollection");

const CLASS_FIELDS = "id title creator { id } teachingTeam { id } mentors { id }";
const PERSON = "id username";

const STUDY_QUERY = `
  id title status dataCollectionStatus dataCollectionOpenForParticipation
  author { ${PERSON} }
  collaborators { ${PERSON} }
  classes { ${CLASS_FIELDS} }
  proposal {
    id title milestoneStatus
    usedInClass { ${CLASS_FIELDS} }
    author { ${PERSON} }
    collaborators { ${PERSON} }
  }
`;

function requireSession(context: any): string {
  const id = context.session?.itemId;
  if (!id) throw new Error("You must be signed in.");
  return String(id);
}

// Loads the study, its boards (each with its study milestone) and the
// caller's rights. Sudo: the class links and staff of a board are not always
// readable by its collaborators, and only feed the checks here.
async function loadSummary(context: any, studyId: string) {
  const callerId = requireSession(context);
  const sudo = context.sudo();
  const study = await sudo.query.Study.findOne({
    where: { id: studyId },
    query: STUDY_QUERY,
  });
  if (!study) throw new Error("Study not found.");

  const boards = await Promise.all(
    (study.proposal || []).map(async (board: any) => {
      const milestones = await resolveMilestonesForBoard(
        null,
        { boardId: board.id },
        sudo
      );
      const milestone = (milestones || []).find(isStudyMilestone) || null;
      return {
        ...board,
        milestone: milestone
          ? {
              id: milestone.id,
              key: milestone.key,
              logEventName: milestone.logEventName,
            }
          : null,
      };
    })
  );

  const callerIsAdmin = isAdmin({ session: context.session } as any);
  const callerCanEdit =
    callerIsAdmin ||
    (await sudo.db.Study.count({
      where: { AND: [{ id: { equals: studyId } }, studyUpdateWhere(callerId)] },
    })) > 0;

  const summary = summarizeStudy({
    study,
    boards,
    callerId,
    callerIsAdmin,
    callerCanEdit,
  });

  // Who did what and when: the study's logs, plus submissions logged on its
  // boards before logs were linked to the study.
  const boardIds = boards.map((board: any) => board.id);
  const logs = await sudo.query.Log.findMany({
    where: {
      AND: [
        { event: { in: historyEvents(boards) } },
        {
          OR: [
            { study: { id: { equals: studyId } } },
            ...(boardIds.length ? [{ proposal: { id: { in: boardIds } } }] : []),
          ],
        },
      ],
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    query: "id event content createdAt user { username }",
  });
  summary.history = summarizeHistory(logs);

  return { summary, study, boards, callerId };
}

export async function studyDataCollection(
  _root: unknown,
  { studyId }: { studyId: string },
  context: any
) {
  const { summary } = await loadSummary(context, studyId);
  return summary;
}

export async function setStudyDataCollection(
  _root: unknown,
  {
    studyId,
    action,
    open,
    stage,
    acknowledgedProfileIds,
    confirmed,
  }: {
    studyId: string;
    action: string;
    open?: boolean | null;
    stage?: string | null;
    acknowledgedProfileIds?: string[] | null;
    confirmed?: boolean | null;
  },
  context: any
) {
  const { summary, boards, callerId } = await loadSummary(context, studyId);
  const plan = planAction(summary, {
    action,
    open,
    stage,
    acknowledgedProfileIds,
    callerId,
    confirmed,
  });
  if (plan.error) throw new Error(plan.error);

  const caller = await context.sudo().query.Profile.findOne({
    where: { id: callerId },
    query: "id username",
  });
  // One timestamp for the milestone entries and the logs.
  const now = new Date().toISOString();
  const writes = buildWrites({
    summary,
    plan,
    action,
    boards,
    caller: caller || { id: callerId },
    now,
  });

  // The only writes the schema hooks accept for these fields: sudo, with the
  // caller's session marked as this mutation's.
  const trusted = context
    .sudo()
    .withSession({ ...context.session, [TRUSTED_SESSION_FLAG]: true });

  await trusted.db.Study.updateOne({
    where: { id: studyId },
    data: writes.study,
  });
  for (const board of writes.boards) {
    await trusted.db.ProposalBoard.updateOne({
      where: { id: board.id },
      data: { milestoneStatus: board.milestoneStatus },
    });
  }

  // Who did it and when, per updated board (so each board's milestone can
  // show it), or once on the study when no board follows it.
  const content = logContent({
    action,
    plan,
    summary,
    caller: caller || { id: callerId },
    now,
    confirmed,
    acknowledgedProfileIds,
    boards: boards.filter((b: any) => b?.milestone?.key),
  });
  const logTargets = writes.boards.length
    ? writes.boards
    : [{ id: null, milestone: null, classId: null }];
  for (const board of logTargets) {
    const event = logEventFor(action, board.milestone);
    if (!event) continue;
    await trusted.db.Log.createOne({
      data: {
        event,
        user: { connect: { id: callerId } },
        study: { connect: { id: studyId } },
        ...(board.id ? { proposal: { connect: { id: board.id } } } : {}),
        ...(board.classId ? { class: { connect: { id: board.classId } } } : {}),
        content,
      },
    });
  }

  const { summary: next } = await loadSummary(context, studyId);
  return next;
}
