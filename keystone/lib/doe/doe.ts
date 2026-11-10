// Shared constants for the NYC DOE data agreement (de-identification and
// deletion of DOE data). See lib/doe/findDoeData.ts.

/** Class.dataOwner value for a class run in an NYC public school. */
export const DOE_DATA_OWNER = "NYC_DOE";

/** Email domains of DOE staff and DOE student accounts. */
export const DOE_STAFF_DOMAIN = "@schools.nyc.gov";
export const DOE_STUDENT_DOMAIN = "@nycstudents.net";

export function isDoeStaffEmail(email: unknown): boolean {
  return (
    typeof email === "string" &&
    email.trim().toLowerCase().endsWith(DOE_STAFF_DOMAIN)
  );
}

/** "02m475 " -> "02M475"; empty stays empty. Validation is the caller's. */
export function normalizeDbn(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Two years without a sign-in, then identity removal (DOE accounts only). */
export const TWO_YEARS_MS = 730 * DAY_MS;
/** The warning email goes out at least this long before. */
export const WARNING_MS = 30 * DAY_MS;

/**
 * The "on or after" date the warning gives: two years after the last sign-in,
 * but never sooner than 30 days after the warning. YYYY-MM-DD.
 */
export function identityRemovalDate(lastSignInAt: Date, warnedAt: Date): string {
  return new Date(
    Math.max(lastSignInAt.getTime() + TWO_YEARS_MS, warnedAt.getTime() + WARNING_MS)
  )
    .toISOString()
    .slice(0, 10);
}
