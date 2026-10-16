// Student task & survey selection on project cards. A template card with
// settings.studentTaskSelection lets students pick tasks and surveys for
// their copy of the card. Picks live in the card's `tasks` next to the
// teacher-linked ones; settings.studentTaskIds says which are the students'.
// Template propagation keeps them (keystone boardPropagation.ts).

export function allowsStudentTaskSelection(card) {
  return !!card?.settings?.studentTaskSelection;
}

export function getStudentTaskIds(card) {
  const ids = card?.settings?.studentTaskIds;
  return Array.isArray(ids) ? ids.filter(Boolean) : [];
}

// The card's tasks the students picked.
export function getStudentPickedTasks(card) {
  const ids = new Set(getStudentTaskIds(card));
  return (card?.tasks || []).filter((task) => ids.has(task?.id));
}

// The card's tasks linked on the template by the teacher.
export function getTemplateLinkedTasks(card) {
  const ids = new Set(getStudentTaskIds(card));
  return (card?.tasks || []).filter((task) => task?.id && !ids.has(task.id));
}
