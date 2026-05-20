/**
 * Resolves a displayable last-updated instant from Keystone timestamp fields.
 * Prefers `updatedAt`, falls back to `createdAt` for legacy rows.
 *
 * @param {{ updatedAt?: string | null, createdAt?: string | null } | null | undefined} item
 * @returns {Date | null}
 */
export function getLastUpdatedDate(item) {
  const raw = item?.updatedAt || item?.createdAt;
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}
