// Who may do what with the links between a study and its project boards
// (Study.proposal ↔ ProposalBoard.study), and what an unlink does. Used by the Links panel
// (components/Builder/shared/StudyBoardLinks).
//
// - People on an object (author, creator, collaborators) act on it.
// - Class staff (creator, co-teachers, mentors) act on every link whose board
//   is used in their class or whose study is linked to / authored in their
//   class.
// - Everyone else sees it read-only.
// These rules live in the UI only: the backend lets any signed-in user update
// a board, and studies follow studyUpdateWhere (keystone/access.ts).

const ids = (list) => (list || []).map((x) => x?.id).filter(Boolean);

export const isAdminUser = (user) =>
  (user?.permissions || []).some((p) => p?.name === "ADMIN");

/** Ids of the classes the user teaches, co-teaches or mentors. */
export function staffClassIds(user) {
  return new Set([
    ...ids(user?.teacherIn),
    ...ids(user?.teachingTeamIn),
    ...ids(user?.mentorIn),
  ]);
}

/** Author, creator or collaborator of a board. */
export const isOnBoard = (board, userId) =>
  !!userId &&
  (board?.author?.id === userId ||
    board?.creator?.id === userId ||
    ids(board?.collaborators).includes(userId));

/** Author or collaborator of a study. */
export const isOnStudy = (study, userId) =>
  !!userId &&
  (study?.author?.id === userId || ids(study?.collaborators).includes(userId));

/**
 * Classes a study belongs to for its teachers: the classes it is linked to
 * and the classes its author and collaborators are students in (as in
 * studyUpdateWhere).
 */
export function studyClasses(study) {
  const all = [
    ...(study?.classes || []),
    ...(study?.author?.studentIn || []),
    ...(study?.collaborators || []).flatMap((p) => p?.studentIn || []),
  ];
  return all.filter(
    (c, i) => c?.id && all.findIndex((x) => x?.id === c.id) === i
  );
}

/** Ids of studyClasses(study). */
export function studyClassIds(study) {
  return new Set(ids(studyClasses(study)));
}

/** Staff of the board's class. */
export function isBoardStaff(board, user) {
  if (isAdminUser(user)) return true;
  const classId = board?.usedInClass?.id;
  return !!classId && staffClassIds(user).has(classId);
}

/** Staff of one of the study's classes. */
export function isStudyStaff(study, user) {
  if (isAdminUser(user)) return true;
  const staff = staffClassIds(user);
  return [...studyClassIds(study)].some((id) => staff.has(id));
}

/** The study's classes the user is staff of (where their pickers look). */
export function staffedStudyClassIds(study, user) {
  const staff = staffClassIds(user);
  return [...studyClassIds(study)].filter((id) => staff.has(id));
}

/**
 * May the user unlink this study from this board? People on the board, and
 * staff of the board's class or of the study's classes. Being on the study
 * alone is not enough: other students' boards stay read-only.
 */
export const canActOnLink = ({ study, board, user }) =>
  isOnBoard(board, user?.id) ||
  isBoardStaff(board, user) ||
  isStudyStaff(study, user);

/** May the user put this board's study in place / connect a study to it? */
export const canActOnBoard = (board, user) =>
  isOnBoard(board, user?.id) || isBoardStaff(board, user);

/** May the user connect more boards to this study? */
export const canActOnStudy = (study, user) =>
  isOnStudy(study, user?.id) || isStudyStaff(study, user);

const classSettings = (cls) => {
  const settings = cls?.settings;
  if (typeof settings !== "string") return settings || {};
  try {
    return JSON.parse(settings) || {};
  } catch {
    return {};
  }
};

/**
 * Whether the classes let their students manage the collaborators of their
 * own boards and studies: true when any of them has
 * Class.settings.studentsManageCollaborators on (off unless set to true;
 * toggled in the teacher class page's Settings tab).
 */
export const classLetsStudentsManagePeople = (classes) =>
  (classes || []).some(
    (cls) => classSettings(cls).studentsManageCollaborators === true
  );

/**
 * May the user add or remove collaborators on a board or study? Class staff
 * always; people on it when it has no class, or when its class allows it.
 */
export function canManagePeople({ kind, object, user }) {
  if (kind === "board") {
    if (isBoardStaff(object, user)) return true;
    if (!isOnBoard(object, user?.id)) return false;
    const cls = object?.usedInClass;
    return !cls?.id || classLetsStudentsManagePeople([cls]);
  }
  if (isStudyStaff(object, user)) return true;
  if (!isOnStudy(object, user?.id)) return false;
  const classes = studyClasses(object);
  return !classes.length || classLetsStudentsManagePeople(classes);
}

/**
 * Who the header facepile shows. On a board: its author and collaborators.
 * On a study: everyone who edits it as author, collaborator or through a
 * linked board (class staff are assumed and left out). Each person once.
 */
export function facepilePeople({ board, study }) {
  const people = board
    ? [board.author, ...(board.collaborators || [])]
    : [
        study?.author,
        ...(study?.collaborators || []),
        ...(study?.proposal || []).flatMap((b) => [b?.author, ...(b?.collaborators || [])]),
      ];
  return people.filter(
    (p, i, all) => p?.id && all.findIndex((x) => x?.id === p.id) === i
  );
}

/**
 * One list for an object's people, each once with its roles:
 * "owner" (author), "creator" (only when not the author) and "collaborator".
 */
export function peopleWithRoles(object) {
  const byId = new Map();
  const add = (person, role) => {
    if (!person?.id) return;
    const entry = byId.get(person.id) || { person, roles: [] };
    if (!entry.roles.includes(role)) entry.roles.push(role);
    byId.set(person.id, entry);
  };
  add(object?.author, "owner");
  if (object?.creator?.id && object.creator.id !== object?.author?.id) {
    add(object.creator, "creator");
  }
  for (const person of object?.collaborators || []) {
    // The owner listed as a collaborator too stays "Owner".
    if (person?.id !== object?.author?.id) add(person, "collaborator");
  }
  return [...byId.values()];
}

/** People who edit the study only through a linked board (not on the study). */
export function viaBoardPeople(study, boards) {
  const onStudy = new Set([study?.author?.id, ...ids(study?.collaborators)]);
  const byId = new Map();
  for (const board of boards || []) {
    for (const person of [board?.author, ...(board?.collaborators || [])]) {
      if (!person?.id || onStudy.has(person.id)) continue;
      const entry = byId.get(person.id) || { person, boards: [] };
      if (!entry.boards.some((b) => b.id === board.id)) entry.boards.push(board);
      byId.set(person.id, entry);
    }
  }
  return [...byId.values()];
}

// Ids of a class's staff (creator, co-teachers, mentors).
const classStaff = (cls) => [
  cls?.creator?.id,
  ...ids(cls?.teachingTeam),
  ...ids(cls?.mentors),
];

/**
 * People who edit the study whatever its boards: staff of its classes and of
 * the classes its author and collaborators are students in
 * (studyUpdateWhere).
 */
function privilegedIds(study) {
  const classes = [
    ...(study?.classes || []),
    ...(study?.author?.studentIn || []),
    ...(study?.collaborators || []).flatMap((p) => p?.studentIn || []),
  ];
  return new Set(classes.flatMap(classStaff).filter(Boolean));
}

/**
 * Board members (author, collaborators) who edit the study only through
 * `board`, and so lose that access when the board leaves the study. Study
 * members, members of its other boards and class staff keep it.
 */
function loseStudyAccess(study, board, boards) {
  const keep = privilegedIds(study);
  keep.add(study?.author?.id);
  ids(study?.collaborators).forEach((id) => keep.add(id));
  for (const other of boards || []) {
    if (other.id === board.id) continue;
    keep.add(other?.author?.id);
    ids(other?.collaborators).forEach((id) => keep.add(id));
  }
  return [board?.author, ...(board?.collaborators || [])].filter(
    (p, i, all) =>
      p?.id && all.findIndex((x) => x?.id === p.id) === i && !keep.has(p.id)
  );
}

const LOCKED = ["SUBMITTED", "FINISHED"];

/**
 * What unlinking `board` from `study` does, as { key, params } items for the
 * confirmation list. `boards` are all the study's (visible) boards.
 */
export function unlinkConsequences({ study, board, boards }) {
  const items = [{ key: "kept", params: {} }];
  if (board?.studyMain?.id && board.studyMain.id === study?.id) {
    items.push({ key: "studyMain", params: {} });
  }
  const losing = loseStudyAccess(study, board, boards);
  if (losing.length) {
    items.push({
      key: "loseAccess",
      params: { people: losing.map((p) => p.username).join(", ") },
    });
  }
  if (board?.isMain) items.push({ key: "mainProject", params: {} });
  const datasets = board?.datasourcesCount || 0;
  if (datasets > 0) {
    items.push({ key: "datasets", params: { count: datasets } });
  }
  if (board?.usedInClass?.id && LOCKED.includes(study?.dataCollectionStatus)) {
    items.push({ key: "dataCollection", params: {} });
  }
  return items;
}
