// A study's data-collection lifecycle, shared by every board linked to it.
//
// A study can be linked to several project boards (one per student, for
// instance), each with its own data-collection milestone. The study is the
// source of truth: submitting, finishing or reopening it updates the study and
// every linked board's milestone together, through the setStudyDataCollection
// mutation (mutations/studyDataCollection.ts). That mutation is the only
// writer of Study.dataCollectionStatus and of the boards' study milestone
// status; the schema hooks (assertTrustedDataCollectionWrite) refuse anyone
// else but admins.
//
// - Supervised study: at least one linked board belongs to a class and
//   resolves a study milestone. Students submit (once every collaborator is
//   acknowledged) and may finish; only the class's teacher or teaching team
//   may reopen or resume it. Submitting locks the study.
// - Self-managed study: no supervising board. `status` is a free label, never
//   locks the study; participation can still be opened and closed.
//
// Study.status is also stamped on every dataset (real vs test participants,
// lib/classDashboard.js), so supervised writes keep it in step.

const STAGES = ["DESIGNING", "COLLECTING", "FINISHED"];

const DATA_COLLECTION_STATUS_FOR_STAGE = {
  DESIGNING: "IN_PROGRESS",
  COLLECTING: "SUBMITTED",
  FINISHED: "FINISHED",
};

const STATUS_FOR_STAGE = {
  DESIGNING: "WORKING",
  COLLECTING: "COLLECTING_DATA",
  FINISHED: "DATA_COLLECTION_IS_COMPLETED",
};

const ACTIONS = [
  "SUBMIT",
  "FINISH",
  "REOPEN",
  "RESUME",
  "SET_PARTICIPATION",
  "SET_LABEL",
];

// Marks the session of the mutation's own writes (see the schema hooks).
const TRUSTED_SESSION_FLAG = "studyDataCollectionWrite";

function isStudyMilestone(milestone) {
  return (
    !!milestone &&
    (milestone.statusTarget === "study" ||
      milestone.actionCardType === "ACTION_COLLECTING_DATA" ||
      milestone.key === "DATA_COLLECTION")
  );
}

function stageFromDataCollectionStatus(value) {
  if (value === "SUBMITTED") return "COLLECTING";
  if (value === "FINISHED") return "FINISHED";
  return "DESIGNING";
}

function stageFromStatus(value) {
  if (value === "COLLECTING_DATA") return "COLLECTING";
  if (value === "DATA_COLLECTION_IS_COMPLETED") return "FINISHED";
  return "DESIGNING";
}

const ids = (list) => (list || []).map((item) => item?.id).filter(Boolean);

function staffIdsOf(klass) {
  return [klass?.creator?.id, ...ids(klass?.teachingTeam), ...ids(klass?.mentors)]
    .filter(Boolean);
}

function teacherIdsOf(klass) {
  return [klass?.creator?.id, ...ids(klass?.teachingTeam)].filter(Boolean);
}

/**
 * Who may do what on a study, and who shares it.
 *
 * @param study `{ id, status, dataCollectionStatus,
 *   dataCollectionOpenForParticipation, author, collaborators, classes }`
 * @param boards linked boards: `{ id, title, usedInClass (with creator,
 *   teachingTeam, mentors), author, collaborators, milestoneStatus,
 *   milestone }` where `milestone` is the board's study milestone, if any
 * @param callerId the signed-in profile
 * @param callerIsAdmin platform admin
 * @param callerCanEdit the caller may update the study (access rules)
 */
function summarizeStudy({ study, boards, callerId, callerIsAdmin, callerCanEdit }) {
  const supervisingBoards = boards.filter(
    (board) => board?.usedInClass?.id && board?.milestone?.key
  );
  const supervised = supervisingBoards.length > 0;
  const locked =
    study?.dataCollectionStatus === "SUBMITTED" ||
    study?.dataCollectionStatus === "FINISHED";
  const readsMilestone = supervised || locked;
  const stage = readsMilestone
    ? stageFromDataCollectionStatus(study?.dataCollectionStatus)
    : stageFromStatus(study?.status);

  // Teachers of a supervising class, or of a class the study belongs to (so a
  // locked study whose board was unlinked can still be reopened).
  const managingClasses = [
    ...supervisingBoards.map((board) => board.usedInClass),
    ...(study?.classes || []),
  ];
  const canManage =
    !!callerIsAdmin ||
    managingClasses.some((klass) => teacherIdsOf(klass).includes(callerId));

  // The people who share the study, without the classes' staff (teachers and
  // mentors supervise; they are not the peers who must agree to submit).
  const staff = new Set(managingClasses.flatMap(staffIdsOf));
  const people = new Map();
  const addPerson = (profile, boardTitle) => {
    if (!profile?.id || staff.has(profile.id)) return;
    const person = people.get(profile.id) || {
      id: profile.id,
      username: profile.username || null,
      boards: [],
    };
    if (boardTitle && !person.boards.includes(boardTitle)) {
      person.boards.push(boardTitle);
    }
    people.set(profile.id, person);
  };
  addPerson(study?.author);
  (study?.collaborators || []).forEach((p) => addPerson(p));
  for (const board of boards) {
    const title = board?.title || "";
    addPerson(board?.author, title);
    (board?.collaborators || []).forEach((p) => addPerson(p, title));
  }

  // Who submitted, from any board's milestone entry.
  let submittedBy = null;
  let submittedAt = null;
  for (const board of supervisingBoards) {
    const entry = board?.milestoneStatus?.[board.milestone.key];
    if (entry?.submittedBy) {
      submittedBy = entry.submittedBy;
      submittedAt = entry.submittedAt || null;
      break;
    }
  }

  return {
    studyId: study?.id,
    supervised,
    locked,
    stage,
    open: !!study?.dataCollectionOpenForParticipation,
    canEdit: !!callerIsAdmin || !!callerCanEdit || canManage,
    canManage,
    boards: boards.map((board) => ({
      id: board.id,
      title: board.title || null,
      classId: board?.usedInClass?.id || null,
      classTitle: board?.usedInClass?.title || null,
      milestoneKey: board?.milestone?.key || null,
      supervising: supervisingBoards.includes(board),
    })),
    people: [...people.values()],
    submittedBy: submittedBy?.username || null,
    submittedAt,
  };
}

function refuse(message) {
  return { error: message };
}

/**
 * What an action does from the current summary: `{ error }` or
 * `{ stage, open, label }` where `label` is true for a self-managed label
 * change (no milestone writes).
 */
// Submitting and finishing apply to everyone sharing the study and only a
// teacher can undo them: whoever does it (student or teacher) ticks a
// confirmation, recorded with their name and the time in the logs.
const CONFIRMED_ACTIONS = ["SUBMIT", "FINISH"];

function planAction(
  summary,
  { action, open, stage, acknowledgedProfileIds, callerId, confirmed }
) {
  if (!ACTIONS.includes(action)) return refuse("Unknown action.");
  if (CONFIRMED_ACTIONS.includes(action) && confirmed !== true) {
    return refuse("Please tick the confirmation before continuing.");
  }
  if (!summary.canEdit) {
    return refuse("You do not have permission to change this study.");
  }
  const milestoneMode = summary.supervised || summary.locked;

  switch (action) {
    case "SUBMIT": {
      if (!summary.supervised) {
        return refuse(
          "This study is not supervised by a class milestone: set its status label instead."
        );
      }
      if (summary.stage !== "DESIGNING") {
        return refuse("This study has already been submitted.");
      }
      // Teachers submit for their students; students must confirm that every
      // other person sharing the study agrees.
      if (!summary.canManage) {
        const acknowledged = new Set(acknowledgedProfileIds || []);
        const missing = summary.people.filter(
          (person) => person.id !== callerId && !acknowledged.has(person.id)
        );
        if (missing.length) {
          return refuse(
            "Everyone who shares this study has to be confirmed before submitting. The list of collaborators may have changed: please review it again."
          );
        }
      }
      return { stage: "COLLECTING", open: true };
    }
    case "FINISH": {
      if (!milestoneMode || summary.stage !== "COLLECTING") {
        return refuse("Only a study collecting data can be finished.");
      }
      return { stage: "FINISHED", open: false };
    }
    case "REOPEN": {
      if (!summary.canManage) {
        return refuse("Only a teacher of the class can reopen this study.");
      }
      if (!milestoneMode || summary.stage === "DESIGNING") {
        return refuse("This study is not submitted.");
      }
      return { stage: "DESIGNING", open: false };
    }
    case "RESUME": {
      if (!summary.canManage) {
        return refuse("Only a teacher of the class can resume data collection.");
      }
      if (!milestoneMode || summary.stage !== "FINISHED") {
        return refuse("Only a finished study can resume data collection.");
      }
      return { stage: "COLLECTING", open: open !== false };
    }
    case "SET_PARTICIPATION": {
      if (milestoneMode && summary.stage !== "COLLECTING") {
        return refuse(
          "Participation can only be opened while the study is collecting data."
        );
      }
      return { stage: summary.stage, open: !!open };
    }
    case "SET_LABEL": {
      if (milestoneMode) {
        return refuse(
          "This study's status follows its class milestone and cannot be set by hand."
        );
      }
      if (!STAGES.includes(stage)) return refuse("Unknown status.");
      return { stage, open: summary.open, label: true };
    }
    default:
      return refuse("Unknown action.");
  }
}

/**
 * The writes for a plan: the study's data, and each supervising board's new
 * milestoneStatus (other milestones' entries are kept as they are).
 */
function buildWrites({ summary, plan, action, boards, caller, now }) {
  if (plan.label) {
    return {
      study: {
        status: STATUS_FOR_STAGE[plan.stage],
        // A finished self-managed study stops taking participants.
        ...(plan.stage === "FINISHED"
          ? { dataCollectionOpenForParticipation: false }
          : {}),
      },
      boards: [],
    };
  }

  const milestoneMode = summary.supervised || summary.locked;
  if (action === "SET_PARTICIPATION" && !milestoneMode) {
    return {
      study: { dataCollectionOpenForParticipation: plan.open },
      boards: [],
    };
  }

  const study = {
    dataCollectionStatus: DATA_COLLECTION_STATUS_FOR_STAGE[plan.stage],
    dataCollectionOpenForParticipation: plan.open,
    status: STATUS_FOR_STAGE[plan.stage],
  };
  // Research exports key on this: a study submitted for data collection
  // collects real data.
  if (action === "SUBMIT") study.dataCollectionData = "REAL_DATA";

  const by = { id: caller.id, username: caller.username || null };
  const boardWrites = boards
    .filter((board) => board?.milestone?.key)
    .map((board) => {
      const key = board.milestone.key;
      const previous = board.milestoneStatus?.[key] || {};
      let entry = {
        status: DATA_COLLECTION_STATUS_FOR_STAGE[plan.stage],
        openForParticipation: plan.open,
      };
      if (action === "SUBMIT") {
        entry = { ...entry, submittedBy: by, submittedAt: now };
      } else if (action !== "REOPEN") {
        // Keep who submitted (and finished) while the study stays submitted.
        const { status, openForParticipation, ...kept } = previous;
        entry = { ...kept, ...entry };
        if (action === "FINISH") {
          entry.finishedBy = by;
          entry.finishedAt = now;
        }
        if (action === "RESUME") {
          delete entry.finishedBy;
          delete entry.finishedAt;
        }
      }
      return {
        id: board.id,
        milestoneStatus: { ...(board.milestoneStatus || {}), [key]: entry },
        milestone: board.milestone,
        classId: board?.usedInClass?.id || null,
      };
    });

  return { study, boards: boardWrites };
}

const SUBMIT_EVENT = "STUDY_SUBMITTED_FOR_DATA_COLLECTION";

const LOG_EVENTS = {
  FINISH: "STUDY_DATA_COLLECTION_FINISHED",
  REOPEN: "STUDY_DATA_COLLECTION_REOPENED",
  RESUME: "STUDY_DATA_COLLECTION_RESUMED",
  SET_PARTICIPATION: "STUDY_PARTICIPATION_CHANGED",
  SET_LABEL: "STUDY_STATUS_LABEL_CHANGED",
};

function logEventFor(action, milestone) {
  if (action === "SUBMIT") return milestone?.logEventName || SUBMIT_EVENT;
  return LOG_EVENTS[action] || null;
}

/** Every event name a study's data-collection history is read from. */
function historyEvents(boards = []) {
  return [
    ...new Set([
      SUBMIT_EVENT,
      ...Object.values(LOG_EVENTS),
      ...boards.map((board) => board?.milestone?.logEventName).filter(Boolean),
    ]),
  ];
}

/**
 * What each log records: who acted and when (also the Log's user and
 * createdAt), what they confirmed and who the decision was shared with, so a
 * board's milestone can show it later.
 */
function logContent({ action, plan, summary, caller, now, confirmed, acknowledgedProfileIds, boards }) {
  const usernames = new Map(summary.people.map((p) => [p.id, p.username || p.id]));
  return {
    action,
    by: { id: caller.id, username: caller.username || null },
    at: now,
    stage: plan.stage,
    openForParticipation: plan.open,
    confirmed: confirmed === true,
    sharedWith: summary.people
      .filter((p) => p.id !== caller.id)
      .map((p) => p.username || p.id),
    acknowledged: (acknowledgedProfileIds || []).map((id) => usernames.get(id) || id),
    boards: boards.map((b) => ({ id: b.id, title: b.title || null })),
  };
}

const ACTION_FOR_EVENT = Object.fromEntries(
  Object.entries(LOG_EVENTS).map(([action, event]) => [event, action])
);

/**
 * The study's data-collection history, newest first: one entry per decision
 * (a decision is logged once per linked board). Older submissions, logged
 * before the study was linked to its logs, are read from their board.
 */
function summarizeHistory(logs = [], limit = 20) {
  const seen = new Set();
  const entries = [];
  const sorted = [...logs].sort((a, b) =>
    String(b?.createdAt || "").localeCompare(String(a?.createdAt || ""))
  );
  for (const log of sorted) {
    const content = parseJson(log?.content) || {};
    const action = content.action || ACTION_FOR_EVENT[log?.event] || "SUBMIT";
    const at = content.at || log?.createdAt || null;
    const by = content.by?.username || log?.user?.username || null;
    const key = `${action}|${at}|${by}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      action,
      by,
      at,
      open: typeof content.openForParticipation === "boolean"
        ? content.openForParticipation
        : null,
      stage: content.stage || null,
      confirmed: !!content.confirmed,
      sharedWith: Array.isArray(content.sharedWith) ? content.sharedWith : [],
    });
    if (entries.length >= limit) break;
  }
  return entries;
}

function parseJson(value) {
  if (typeof value !== "string") return value ?? null;
  try {
    return JSON.parse(value);
  } catch (err) {
    return null;
  }
}

/**
 * Study milestone entries whose status a write would change: keys of entries
 * that carry `openForParticipation` (only study milestones do) before or
 * after. Used by the ProposalBoard hook to refuse untrusted writes.
 */
function changedStudyMilestoneStatuses(previousValue, nextValue) {
  const previous = parseJson(previousValue) || {};
  const next = parseJson(nextValue) || {};
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  const changed = [];
  for (const key of keys) {
    const before = previous[key];
    const after = next[key];
    const isStudyEntry =
      (before && "openForParticipation" in before) ||
      (after && "openForParticipation" in after);
    if (!isStudyEntry) continue;
    if ((before?.status || null) !== (after?.status || null)) changed.push(key);
  }
  return changed;
}

function isTrustedSession(session) {
  return !!session?.[TRUSTED_SESSION_FLAG];
}

module.exports = {
  STAGES,
  ACTIONS,
  TRUSTED_SESSION_FLAG,
  DATA_COLLECTION_STATUS_FOR_STAGE,
  STATUS_FOR_STAGE,
  isStudyMilestone,
  summarizeStudy,
  planAction,
  buildWrites,
  logEventFor,
  logContent,
  historyEvents,
  summarizeHistory,
  changedStudyMilestoneStatuses,
  isTrustedSession,
};
