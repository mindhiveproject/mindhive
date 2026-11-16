const { loadCardAssignmentHomeworks } = require("../lib/cardAssignmentHomeworks");

// Homework of some authors on some assignments, for a project card's
// assignment status chips, read under Homework's own read filter. See
// lib/cardAssignmentHomeworks.js.
async function cardAssignmentHomeworks(
  root: any,
  { assignmentIds, authorIds }: { assignmentIds: string[]; authorIds: string[] },
  context: any
): Promise<any> {
  return loadCardAssignmentHomeworks(context, assignmentIds, authorIds);
}

export default cardAssignmentHomeworks;
