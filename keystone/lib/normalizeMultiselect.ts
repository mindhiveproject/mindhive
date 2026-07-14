/**
 * Normalize legacy Opportunity multiselect column values to string[].
 *
 * GraphQL multiselect fields are [String!] lists. Legacy rows may store:
 * - a JSON array (correct)
 * - a JSON-encoded scalar string (e.g. "middle")
 * - a plain scalar string
 * - a double-encoded JSON string (SQLite write hook + field polyfill)
 */
export function normalizeMultiselectValue(value: unknown): string[] {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }

  if (typeof value !== "string") return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === "string");
    }
    if (typeof parsed === "string" && parsed.trim()) {
      if (parsed.trim().startsWith("[")) {
        return normalizeMultiselectValue(parsed);
      }
      return [parsed.trim()];
    }
  } catch {
    // Legacy scalar stored without JSON array wrapper.
  }

  return [trimmed];
}

/** True when stored value is already a clean string array for GraphQL/Prisma. */
export function multiselectNeedsNormalization(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) {
    return value.some((v) => typeof v !== "string");
  }
  return true;
}

export function normalizedMultiselectForStorage(value: unknown): string[] {
  return normalizeMultiselectValue(value);
}
