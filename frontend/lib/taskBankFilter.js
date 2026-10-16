// Which tasks the discover page's task bank shows. `public` is the publishing
// gate for everyone; signed-out visitors only get the `featured` preview, while
// signed-in users see every published task minus what their classes hide
// (see hiddenTaskIdsFor). The descriptions PDF exports the same set.
export function buildTaskBankWhere({ user, taskType, hiddenTaskIds = [] }) {
  const where = { public: { equals: true } };
  if (!user) {
    where.featured = { equals: true };
  }
  if (taskType) {
    where.taskType = { equals: taskType };
  }
  return excludeHiddenTasks(where, hiddenTaskIds);
}

// Roles that see every task regardless of class block lists.
const CLASS_STAFF_ROLES = ["teacherIn", "teachingTeamIn", "mentorIn"];

// Tasks hidden from this user by their classes' block lists
// (Class.hiddenTasks). Only students are affected, and a task is hidden only
// when every one of their classes hides it: one class allowing it is enough.
// Admins and class staff anywhere see everything.
export function hiddenTaskIdsFor(user) {
  return hiddenIdsFor(user, "hiddenTasks");
}

// Featured studies hidden from this user by their classes
// (Class.hiddenStudies), with the same rules as hiddenTaskIdsFor.
export function hiddenStudyIdsFor(user) {
  return hiddenIdsFor(user, "hiddenStudies");
}

function hiddenIdsFor(user, field) {
  if (!user) return [];
  if (user.permissions?.some((permission) => permission?.name === "ADMIN")) {
    return [];
  }
  if (CLASS_STAFF_ROLES.some((role) => user[role]?.length)) return [];

  const classes = user.studentIn || [];
  if (!classes.length) return [];

  const [first, ...rest] = classes.map(
    (cls) => new Set((cls?.[field] || []).map((item) => item?.id))
  );
  return [...first].filter((id) => rest.every((ids) => ids.has(id)));
}

// Adds the block list to a TaskWhereInput.
export function excludeHiddenTasks(where, hiddenTaskIds) {
  return hiddenTaskIds?.length
    ? { ...where, id: { notIn: hiddenTaskIds } }
    : where;
}
