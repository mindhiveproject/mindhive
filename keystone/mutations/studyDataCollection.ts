// studyDataCollection (query) and setStudyDataCollection (mutation): a
// study's data-collection state and the one way to change it. See
// lib/studyDataCollection.js for the rules.
//
// classDataCollection (query) and setClassDataCollection (mutation): whether
// a class supervises its studies' data collection itself, without a project
// board template. Turning it on carries over the studies its students had
// already labelled as collecting or finished, through the same writes.
import { isAdmin, studyUpdateWhere } from "../access";
import resolveMilestonesForBoard from "./resolveMilestonesForBoard";

const {
  TRUSTED_SESSION_FLAG,
  isStudyMilestone,
  classFollowsDataCollection,
  carryOverStage,
  turnOffImpact,
  summarizeStudy,
  planAction,
  buildWrites,
  logEventFor,
  logContent,
  historyEvents,
  summarizeHistory,
} = require("../lib/studyDataCollection");

const CLASS_FIELDS =
  "id title settings creator { id } teachingTeam { id } mentors { id }";
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
  // A class-supervised study has no board entry recording who submitted it:
  // read it from its latest submission.
  if (!summary.submittedBy && summary.stage !== "DESIGNING") {
    const submit = summary.history.find((entry: any) => entry.action === "SUBMIT");
    if (submit) {
      summary.submittedBy = submit.by;
      summary.submittedAt = submit.at;
    }
  }

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
  args: {
    studyId: string;
    action: string;
    open?: boolean | null;
    stage?: string | null;
    acknowledgedProfileIds?: string[] | null;
    confirmed?: boolean | null;
  },
  context: any
) {
  await applyStudyDataCollection(context, args);
  const { summary: next } = await loadSummary(context, args.studyId);
  return next;
}

// Plans and writes one action on a study, its boards and its logs. The only
// writer of the data-collection fields (see the schema hooks).
async function applyStudyDataCollection(
  context: any,
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
  { carriedOver = false }: { carriedOver?: boolean } = {}
) {
  const { summary, boards, callerId } = await loadSummary(context, studyId);
  let plan = planAction(summary, {
    action,
    open,
    stage,
    acknowledgedProfileIds,
    callerId,
    confirmed,
  });
  if (plan.error) throw new Error(plan.error);
  // A carried-over study keeps the participation its students had set.
  if (carriedOver && action === "SUBMIT") plan = { ...plan, open: summary.open };

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
  // show it), or once on the study when no board follows it (linked to the
  // supervising class, if any).
  const content = logContent({
    action,
    plan,
    summary,
    caller: caller || { id: callerId },
    now,
    confirmed,
    acknowledgedProfileIds,
    boards: boards.filter((b: any) => b?.milestone?.key),
    carriedOver,
  });
  const supervisingClass = (summary.classes || []).find((c: any) => c.supervising);
  const logTargets = writes.boards.length
    ? writes.boards
    : [{ id: null, milestone: null, classId: supervisingClass?.id || null }];
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
}

const CLASS_QUERY = `
  id title settings creator { id } teachingTeam { id }
  templateProposal { id title }
  classTemplateBoards { id title }
`;

// The class, its template boards that carry a data-collection milestone and
// whether the caller teaches it.
async function loadClassState(context: any, classId: string) {
  const callerId = requireSession(context);
  const sudo = context.sudo();
  const klass = await sudo.query.Class.findOne({
    where: { id: classId },
    query: CLASS_QUERY,
  });
  if (!klass) throw new Error("Class not found.");

  const callerIsAdmin = isAdmin({ session: context.session } as any);
  const canManage =
    callerIsAdmin ||
    [klass.creator?.id, ...(klass.teachingTeam || []).map((p: any) => p.id)]
      .filter(Boolean)
      .includes(callerId);

  const templates = [
    ...new Map(
      [klass.templateProposal, ...(klass.classTemplateBoards || [])]
        .filter((board: any) => board?.id)
        .map((board: any) => [board.id, board])
    ).values(),
  ];
  const templateBoards = [];
  for (const board of templates as any[]) {
    const milestones = await resolveMilestonesForBoard(
      null,
      { boardId: board.id },
      sudo
    );
    if ((milestones || []).some(isStudyMilestone)) {
      templateBoards.push({ id: board.id, title: board.title || null });
    }
  }

  // Every study of the class, for what turning the milestone on (carry-over)
  // or off (turnOffImpact) would do to it.
  const studies = await sudo.query.Study.findMany({
    where: { classes: { some: { id: { equals: classId } } } },
    query:
      "id status dataCollectionStatus classes { id settings } proposal { id usedInClass { id } }",
  });
  const carryOver = studies
    .map((study: any) => ({ id: study.id, stage: carryOverStage(study) }))
    .filter((study: any) => study.stage);

  // A linked board supervises a study when it is used in a class and
  // resolves a study milestone (as in summarizeStudy). Resolved once per
  // board.
  const boardHasMilestone = new Map<string, Promise<boolean>>();
  const supervisesStudy = (board: any) => {
    if (!board?.usedInClass?.id) return Promise.resolve(false);
    if (!boardHasMilestone.has(board.id)) {
      boardHasMilestone.set(
        board.id,
        resolveMilestonesForBoard(null, { boardId: board.id }, sudo).then(
          (milestones: any[]) => (milestones || []).some(isStudyMilestone)
        )
      );
    }
    return boardHasMilestone.get(board.id) as Promise<boolean>;
  };
  const withBoards = await Promise.all(
    studies.map(async (study: any) => ({
      ...study,
      boardSupervised: (
        await Promise.all((study.proposal || []).map(supervisesStudy))
      ).some(Boolean),
    }))
  );
  const impact = turnOffImpact(withBoards, classId);

  return {
    klass,
    canManage,
    state: {
      classId,
      enabled: classFollowsDataCollection(klass),
      canManage,
      templateBoards,
      carryOverCollecting: carryOver.filter((s: any) => s.stage === "COLLECTING")
        .length,
      carryOverFinished: carryOver.filter((s: any) => s.stage === "FINISHED")
        .length,
      turnOffKeep: impact.keep,
      turnOffStaysLocked: impact.staysLocked,
      turnOffSelfManaged: impact.selfManaged,
    },
    carryOver,
  };
}

export async function classDataCollection(
  _root: unknown,
  { classId }: { classId: string },
  context: any
) {
  const { state } = await loadClassState(context, classId);
  return state;
}

export async function setClassDataCollection(
  _root: unknown,
  { classId, enabled }: { classId: string; enabled: boolean },
  context: any
) {
  const { klass, canManage, carryOver } = await loadClassState(context, classId);
  if (!canManage) {
    throw new Error("Only a teacher of the class can change its milestones.");
  }
  const settings =
    klass.settings && typeof klass.settings === "object" ? klass.settings : {};
  await context.sudo().db.Class.updateOne({
    where: { id: classId },
    data: { settings: { ...settings, dataCollectionMilestone: !!enabled } },
  });

  // Turning it on: studies the students had labelled as collecting (or
  // finished) are submitted (and finished) under the teacher's name, so
  // nothing reads as having gone back to Designing. Turning it off changes no
  // study: submitted ones stay locked until a teacher reopens them.
  if (enabled) {
    for (const study of carryOver) {
      await applyStudyDataCollection(
        context,
        { studyId: study.id, action: "SUBMIT", confirmed: true },
        { carriedOver: true }
      );
      if (study.stage === "FINISHED") {
        await applyStudyDataCollection(
          context,
          { studyId: study.id, action: "FINISH", confirmed: true },
          { carriedOver: true }
        );
      }
    }
  }

  const { state } = await loadClassState(context, classId);
  return state;
}
