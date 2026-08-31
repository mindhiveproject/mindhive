/** Builder block / task type identifiers used across the canvas and side panel. */
export type TaskType = "TASK" | "SURVEY" | "BLOCK" | "DESIGN";

/** A `{ bg, fg }` fill/text pair for a task-type label chip. */
export interface TaskTypeLabelColors {
  /** Chip fill — a light tint of the task-type accent. */
  bg: string;
  /** Label text — a darkened step of the accent, AA against `bg` at 14px. */
  fg: string;
}

/** Accent colors for builder block / task types (canvas + side panel). */
export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  TASK: "#64C9E2",
  SURVEY: "#28619E",
  BLOCK: "#FF9780",
  DESIGN: "#007C70",
};

/**
 * Accent color for a task type. Accepts any string; unknown types fall back to
 * `fallback` (defaults to the DESIGN accent).
 */
export function getTaskTypeColor(
  taskType: string,
  fallback: string = TASK_TYPE_COLORS.DESIGN
): string {
  return TASK_TYPE_COLORS[taskType as TaskType] || fallback;
}

/**
 * Label-chip pair for the task/survey card: a light tint of the task-type color
 * for the fill, and a darkened step of it for the text. Text is AA (>= 4.5:1)
 * against its own fill for 14px labels — the base task-type colors are not, so
 * the `fg` here is deliberately darker than `TASK_TYPE_COLORS`.
 */
export const TASK_TYPE_LABEL_COLORS: Record<TaskType, TaskTypeLabelColors> = {
  TASK: { bg: "#ECF9FC", fg: "#38717F" },
  SURVEY: { bg: "#E5ECF3", fg: "#23558B" },
  BLOCK: { bg: "#FFEEEA", fg: "#A84A32" },
  DESIGN: { bg: "#E1F0EE", fg: "#005F55" },
};

/**
 * Label chip `{ bg, fg }` for a task type. Accepts any string; unknown types
 * fall back to `fallback` (defaults to the DESIGN pair).
 */
export function getTaskTypeLabelColors(
  taskType: string,
  fallback: TaskTypeLabelColors = TASK_TYPE_LABEL_COLORS.DESIGN
): TaskTypeLabelColors {
  return TASK_TYPE_LABEL_COLORS[taskType as TaskType] || fallback;
}
