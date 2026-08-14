/**
 * Profile.organization is a Keystone text column that may hold:
 * - a single affiliation string
 * - a JSON-stringified array of affiliation strings
 * - (at runtime) a real string[] from form state before save
 *
 * These helpers are the single source of truth for reading that field
 * so chips and text never render a raw `["A","B"]` value.
 */

function trimName(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function namesFromArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(trimName).filter(Boolean);
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function normalizeOrganizationNames(value) {
  if (value == null || value === "") return [];

  if (Array.isArray(value)) {
    return namesFromArray(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return namesFromArray(parsed);
        }
      } catch {
        // Not valid JSON — treat as a plain affiliation string.
      }
    }

    return [trimmed];
  }

  return [];
}

/**
 * @param {unknown} value
 * @param {string} [separator=", "]
 * @returns {string}
 */
export function formatOrganizationLabel(value, separator = ", ") {
  return normalizeOrganizationNames(value).join(separator);
}

/**
 * Space-joined names for client-side search (safe for .toLowerCase()).
 * @param {unknown} value
 * @returns {string}
 */
export function organizationSearchText(value) {
  return normalizeOrganizationNames(value).join(" ");
}
