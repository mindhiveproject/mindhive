export const frontendUrl = () =>
  (process.env.NODE_ENV === "development"
    ? process.env.FRONTEND_URL_DEV
    : process.env.FRONTEND_URL) || "https://mindhive.science";

type ClassLike = {
  id?: string | null;
  code?: string | null;
};

/**
 * Pick a class the student belongs to that is linked to the round's network.
 * Falls back to any network class with a code when enrollment data is missing.
 */
export function pickStudentClassForRound(
  studentClasses: ClassLike[] | null | undefined,
  networkClasses: ClassLike[] | null | undefined,
): ClassLike | null {
  const networkById = new Map(
    (networkClasses || [])
      .filter((cls) => cls?.id)
      .map((cls) => [String(cls.id), cls]),
  );

  for (const cls of studentClasses || []) {
    if (cls?.id && networkById.has(String(cls.id)) && cls.code) {
      return cls;
    }
  }

  for (const cls of networkClasses || []) {
    if (cls?.code) return cls;
  }

  return null;
}

/** Deep link into the student class Opportunities tab (ranking when round is set). */
export function studentOpportunitiesUrl(
  classCode: string | null | undefined,
  roundId?: string | null,
): string {
  const base = frontendUrl();
  if (classCode) {
    const params = new URLSearchParams({ page: "opportunities" });
    if (roundId) params.set("round", String(roundId));
    return `${base}/dashboard/classes/${encodeURIComponent(classCode)}?${params.toString()}`;
  }
  return `${base}/dashboard/classes`;
}
