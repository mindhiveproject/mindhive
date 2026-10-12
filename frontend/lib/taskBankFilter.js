// Which tasks the discover page's task bank shows. `public` is the publishing
// gate for everyone; signed-out visitors only get the `featured` preview, while
// signed-in users see every published task. A teacher's per-class selection
// will narrow this further later (shared with the descriptions PDF export).
export function buildTaskBankWhere({ user, taskType }) {
  const where = { public: { equals: true } };
  if (!user) {
    where.featured = { equals: true };
  }
  if (taskType) {
    where.taskType = { equals: taskType };
  }
  return where;
}
