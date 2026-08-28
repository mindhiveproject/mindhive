/** Accent colors for builder block / task types (canvas + side panel). */
export const TASK_TYPE_COLORS = {
  TASK: "#3D85B0",
  SURVEY: "#55808C",
  BLOCK: "#FF9780",
  DESIGN: "#007C70",
};

export function getTaskTypeColor(
  taskType,
  fallback = TASK_TYPE_COLORS.DESIGN
) {
  return TASK_TYPE_COLORS[taskType] || fallback;
}

/**
 * Label-chip pair for the task/survey card: a light tint of the task-type color
 * for the fill, and a darkened step of it for the text. Text is AA (>= 4.5:1)
 * against its own fill for 14px labels — the base task-type colors are not, so
 * the `fg` here is deliberately darker than `TASK_TYPE_COLORS`.
 */
export const TASK_TYPE_LABEL_COLORS = {
  TASK: { bg: "#E8F1F7", fg: "#2F6A8E" },
  SURVEY: { bg: "#EEF3F4", fg: "#3F6470" },
  BLOCK: { bg: "#FFEEEA", fg: "#A84A32" },
  DESIGN: { bg: "#E1F0EE", fg: "#005F55" },
};

export function getTaskTypeLabelColors(
  taskType,
  fallback = TASK_TYPE_LABEL_COLORS.DESIGN
) {
  return TASK_TYPE_LABEL_COLORS[taskType] || fallback;
}
