/**
 * ConnectPreference.studentMatchingPreference persisted shape:
 *   { queue: "team_first" | "project_first", chosenAt? }
 */

export const MATCHING_QUEUE_TEAM_FIRST = "team_first";
export const MATCHING_QUEUE_PROJECT_FIRST = "project_first";

export type MatchingQueue =
  | typeof MATCHING_QUEUE_TEAM_FIRST
  | typeof MATCHING_QUEUE_PROJECT_FIRST;

export type StudentMatchingPreference = {
  queue: MatchingQueue;
  chosenAt?: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export function isMatchingQueue(value: unknown): value is MatchingQueue {
  return (
    value === MATCHING_QUEUE_TEAM_FIRST ||
    value === MATCHING_QUEUE_PROJECT_FIRST
  );
}

export function getMatchingQueue(
  studentMatchingPreference: unknown
): MatchingQueue | null {
  if (!isPlainObject(studentMatchingPreference)) return null;
  const queue = studentMatchingPreference.queue;
  return isMatchingQueue(queue) ? queue : null;
}

export function buildStudentMatchingPreference(
  queue: MatchingQueue,
  chosenAt: Date = new Date()
): StudentMatchingPreference {
  return {
    queue,
    chosenAt: chosenAt.toISOString(),
  };
}
