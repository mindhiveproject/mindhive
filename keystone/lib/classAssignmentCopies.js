// Pure rules for which class owns an assignment linked on a class template
// board (copyProposalBoard, repairClassTemplateAssignments). Kept free of
// Keystone so they can be unit tested with node:test.

/** Class ids a board is a template for (both relationship fields). */
function templateClassIds(board) {
  return [
    ...new Set(
      [...(board?.templateForClasses || []), ...(board?.templatesForClass || [])]
        .map((c) => c && c.id)
        .filter(Boolean)
        .map(String)
    ),
  ];
}

/**
 * Whether a board copy reuses the source board's assignment rows instead of
 * creating its own. Only a student/working copy of a class template
 * (classIdUsed without classIdTemplate) reuses them: the students answer the
 * class's assignments. A copy made into a class template (classIdTemplate)
 * always gets its own rows, whatever the source is, so each class owns,
 * edits and publishes its assignments independently.
 */
function shouldReuseAssignments({ classIdTemplate, sourceIsClassTemplate }) {
  if (classIdTemplate) return false;
  return Boolean(sourceIsClassTemplate);
}

/**
 * Unique assignments linked on a board's cards, each with the card ids that
 * link it. `sections[].cards[].assignments[]` as read from Keystone.
 */
function collectCardAssignments(sections) {
  const byId = new Map();
  for (const section of sections || []) {
    for (const card of section?.cards || []) {
      for (const assignment of card?.assignments || []) {
        if (!assignment?.id) continue;
        const entry = byId.get(assignment.id) || { assignment, cardIds: [] };
        if (card.id && !entry.cardIds.includes(card.id)) {
          entry.cardIds.push(card.id);
        }
        byId.set(assignment.id, entry);
      }
    }
  }
  return [...byId.values()];
}

/**
 * Assignments on a class template board that belong to another class: linked
 * on its cards, not a platform template, and connected to at least one class
 * the board is not a template for (typically the class whose template board
 * this one was copied from, sharing the same rows). Each needs its own copy
 * for this board's classes. Returns [] for a board that is not a class
 * template. Assignments with no class at all are left alone (the class-link
 * backfill handles those).
 */
function selectAssignmentsToSplit(board) {
  const classIds = templateClassIds(board);
  if (classIds.length === 0) return [];
  const own = new Set(classIds);
  return collectCardAssignments(board?.sections).filter(({ assignment }) => {
    if (assignment.isTemplate) return false;
    return (assignment.classes || []).some((c) => c?.id && !own.has(String(c.id)));
  });
}

module.exports = {
  templateClassIds,
  shouldReuseAssignments,
  collectCardAssignments,
  selectAssignmentsToSplit,
};
