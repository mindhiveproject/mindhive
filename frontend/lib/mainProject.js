// Client-side view of the main-project rules. The server enforces them
// (keystone/lib/mainProject.js); these helpers only explain to the user what
// will happen or why something is not possible.

/** Creator, co-teachers and mentors of a class. */
export function classStaffIds(klass) {
  return new Set(
    [
      klass?.creator?.id,
      ...(klass?.teachingTeam || []).map((member) => member?.id),
      ...(klass?.mentors || []).map((mentor) => mentor?.id),
    ].filter(Boolean)
  );
}

/**
 * The students on a board: its author and collaborators, without the staff of
 * its class. A board a teacher created for one student is that student's own.
 */
export function boardStudentIds(board, staffIds = classStaffIds(board?.usedInClass)) {
  return new Set(
    [board?.author?.id, ...(board?.collaborators || []).map((c) => c?.id)].filter(
      (id) => id && !staffIds.has(id)
    )
  );
}

/** More than one student on the board: its main flag is theirs too. */
export function isSharedBoard(board, staffIds) {
  return boardStudentIds(board, staffIds).size > 1;
}

/**
 * Splits the other main projects of a board's students into those that are
 * replaced when the board becomes main (everyone on them is on this board)
 * and those that block it (shared with a student who is not on this board).
 */
export function splitOtherMains(board, otherMains, staffIds) {
  const students = boardStudentIds(board, staffIds);
  const replaced = [];
  const blocking = [];
  for (const other of otherMains || []) {
    const otherStudents = [...boardStudentIds(other, staffIds)];
    if (!otherStudents.some((id) => students.has(id))) continue;
    if (otherStudents.every((id) => students.has(id))) replaced.push(other);
    else blocking.push(other);
  }
  return { replaced, blocking };
}

const started = (status) => !!status && status !== "NOT_STARTED";

/** Submitted or reviewed work, which belongs to the class it was done in. */
export function boardHasSubmittedWork(board) {
  if (!board) return false;
  if (board.isSubmitted) return true;
  if (
    started(board.submitProposalStatus) ||
    started(board.peerFeedbackStatus) ||
    started(board.projectReportStatus)
  ) {
    return true;
  }
  const milestoneStatus = board.milestoneStatus;
  if (milestoneStatus && typeof milestoneStatus === "object") {
    if (Object.values(milestoneStatus).some((entry) => started(entry?.status))) {
      return true;
    }
  }
  return (board.reviewsCount || 0) > 0;
}

/**
 * The reason a rule refused a board update, without Keystone's wrapping
 * ("You provided invalid data for this operation.\n  - ProposalBoard: …").
 */
export function boardRuleMessage(error) {
  const message = error?.graphQLErrors?.[0]?.message || error?.message || "";
  const reasons = message
    .split("\n")
    .slice(1)
    .map((line) => line.replace(/^\s*-\s*/, "").replace(/^ProposalBoard(\.\w+)*:\s*/, ""))
    .filter(Boolean);
  return reasons.length ? reasons.join(" ") : message;
}
