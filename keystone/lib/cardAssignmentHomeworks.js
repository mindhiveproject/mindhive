// Homework of some authors on some assignments, for the status chips of a
// project card's linked assignments (GET_HOMEWORK_FOR_CARD_ASSIGNMENTS_BY_AUTHORS).
//
// Through the regular API (homeworks { assignment { id } author { id } })
// Keystone resolved each homework's assignment and author one row at a time
// and ran the Assignment and Profile read filters for each — Assignment's is
// expensive — so opening a card with a class's worth of homework took seconds
// and held database connections. Here the rows are read once through
// context.db, which applies Homework's own read filter (author, class staff,
// peer reviewers, board team; see homeworkQueryFilter in access.ts) and
// returns the assignment and author ids straight from the row. Homework has no
// field-level read rules, so nothing beyond the list filter is skipped.

// JSON fields come back parsed from Postgres and as text from SQLite.
function parseJson(value) {
  if (typeof value !== "string") return value ?? null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

const uniqueIds = (ids) => [...new Set((ids || []).filter(Boolean).map(String))];

async function loadCardAssignmentHomeworks(context, assignmentIds, authorIds) {
  if (!context.session?.itemId) return [];
  const assignments = uniqueIds(assignmentIds);
  const authors = uniqueIds(authorIds);
  if (assignments.length === 0 || authors.length === 0) return [];

  const rows = await context.db.Homework.findMany({
    where: {
      assignment: { id: { in: assignments } },
      author: { id: { in: authors } },
    },
  });
  // Same shape the GraphQL selection had: { id settings assignment { id }
  // author { id } }.
  return rows.map((row) => ({
    id: row.id,
    settings: parseJson(row.settings),
    assignment: row.assignmentId ? { id: row.assignmentId } : null,
    author: row.authorId ? { id: row.authorId } : null,
  }));
}

module.exports = {
  loadCardAssignmentHomeworks,
};
