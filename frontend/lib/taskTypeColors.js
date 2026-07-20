/** Accent colors for builder block / task types (canvas + side panel). */
export const TASK_TYPE_COLORS = {
  TASK: "#3D85B0",
  SURVEY: "#55808C",
  BLOCK: "#CF6D6A",
  DESIGN: "#007C70",
};

export function getTaskTypeColor(
  taskType,
  fallback = TASK_TYPE_COLORS.DESIGN
) {
  return TASK_TYPE_COLORS[taskType] || fallback;
}
