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
