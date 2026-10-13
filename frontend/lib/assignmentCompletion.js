import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_TEMPLATE_ASSIGNMENT_COMPLETION } from "../components/Queries/Homework";
import { getBoardTemplateClassIds } from "./classTemplateBoards";

const COMPLETED = "Completed";

/**
 * Homework status per assignment for a set of authors, as shown on an
 * assignment chip: "Completed" only when every author completed it; an
 * unfinished status (e.g. "Started") when some homework exists; else none.
 * For a student the authors are just themselves; for a teacher visiting a
 * student board, the board's students — so both see the same chip.
 */
export function statusByAssignmentForAuthors(homeworks, authorIds) {
  const authors = new Set((authorIds || []).filter(Boolean));
  const byAssignment = new Map();
  for (const hw of homeworks || []) {
    const assignmentId = hw?.assignment?.id;
    const authorId = hw?.author?.id;
    const status = hw?.settings?.status;
    if (!assignmentId || !authors.has(authorId) || !status) continue;
    if (!byAssignment.has(assignmentId)) byAssignment.set(assignmentId, new Map());
    const byAuthor = byAssignment.get(assignmentId);
    if (byAuthor.get(authorId) !== COMPLETED) byAuthor.set(authorId, status);
  }

  const result = {};
  for (const [assignmentId, byAuthor] of byAssignment) {
    const allCompleted =
      authors.size > 0 &&
      [...authors].every((id) => byAuthor.get(id) === COMPLETED);
    if (allCompleted) {
      result[assignmentId] = COMPLETED;
      continue;
    }
    // Not everyone is done: show an unfinished status, even when the only
    // homework so far is one student's completed one.
    const inProgress = [...byAuthor.values()].find((s) => s !== COMPLETED);
    result[assignmentId] = inProgress || "Started";
  }
  return result;
}

/**
 * { [assignmentId]: { completed, total } } for a class template board: total
 * is the students of the template's classes who are on a student board copied
 * from it; completed is how many of them completed the assignment.
 */
export function templateCompletionByAssignment(data, assignmentIds) {
  const classStudentIds = new Set((data?.profiles || []).map((p) => p?.id));
  const templateStudentIds = new Set();
  for (const board of data?.proposalBoards || []) {
    for (const member of [board?.author, ...(board?.collaborators || [])]) {
      if (member?.id && classStudentIds.has(member.id)) {
        templateStudentIds.add(member.id);
      }
    }
  }

  const completedBy = new Map();
  for (const hw of data?.homeworks || []) {
    const assignmentId = hw?.assignment?.id;
    const authorId = hw?.author?.id;
    if (!assignmentId || !templateStudentIds.has(authorId)) continue;
    if (hw?.settings?.status !== COMPLETED) continue;
    if (!completedBy.has(assignmentId)) completedBy.set(assignmentId, new Set());
    completedBy.get(assignmentId).add(authorId);
  }

  const result = {};
  for (const assignmentId of assignmentIds || []) {
    result[assignmentId] = {
      completed: completedBy.get(assignmentId)?.size || 0,
      total: templateStudentIds.size,
    };
  }
  return result;
}

/**
 * Completion counts for assignment chips on a class template board (edit
 * mode). Returns null when the board is not a class template.
 */
export function useTemplateAssignmentCompletion(board, assignments) {
  const classIds = getBoardTemplateClassIds(board);
  // Keyed by value so a re-rendered list with the same ids keeps the memo.
  const idsKey = (assignments || []).map((a) => a?.id).filter(Boolean).join(",");
  const assignmentIds = useMemo(() => (idsKey ? idsKey.split(",") : []), [idsKey]);
  const skip = !board?.id || classIds.length === 0 || assignmentIds.length === 0;
  const { data } = useQuery(GET_TEMPLATE_ASSIGNMENT_COMPLETION, {
    variables: { templateBoardId: board?.id, classIds, assignmentIds },
    skip,
  });
  return useMemo(
    () => (skip || !data ? null : templateCompletionByAssignment(data, assignmentIds)),
    [skip, data, assignmentIds]
  );
}
