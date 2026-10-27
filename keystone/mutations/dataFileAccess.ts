// Access checks for the frontend's raw-data routes
// (frontend/pages/api/data/[year]/[month]/[day]/[token].js and
// frontend/pages/api/download/rawfiles.js). Those routes read files from disk
// and used to serve them to anyone holding a file's date and token; they now
// forward the caller's session cookie here first.
//
// Both queries run as the caller, not sudo, so the lists' own access rules
// decide: Dataset reads go through resultAccess (a study's team, its board's
// team, admins); a Data Journal file must belong to a datasource the caller
// can read.

const MAX_TOKENS = 5000;

/** The tokens among `tokens` whose datasets the caller may read. */
export async function readableDatasetTokens(
  root: any,
  { tokens }: { tokens: string[] },
  context: any
): Promise<string[]> {
  if (!context.session?.itemId) return [];
  const wanted = [
    ...new Set((tokens || []).filter((t) => typeof t === "string" && t)),
  ].slice(0, MAX_TOKENS);
  if (!wanted.length) return [];
  const rows = await context.db.Dataset.findMany({
    where: { token: { in: wanted } },
  });
  return rows.map((row: any) => row.token);
}

/** Whether the caller may read a Data Journal file of this datasource. */
export async function canReadDatasourceFile(
  root: any,
  { datasourceId, token }: { datasourceId: string; token: string },
  context: any
): Promise<boolean> {
  if (!context.session?.itemId || !datasourceId || !token) return false;
  const datasource = await context.db.Datasource.findOne({
    where: { id: datasourceId },
  });
  if (!datasource) return false;
  // the file's address (year/month/day/token) lives in the datasource content,
  // stored as text on SQLite and as JSON on Postgres
  let content: unknown = datasource.content;
  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch {
      return false;
    }
  }
  return holdsValue(content, token);
}

/** Whether `value` holds `token` anywhere as an exact string value. */
function holdsValue(value: unknown, token: string): boolean {
  if (value === token) return true;
  if (Array.isArray(value)) return value.some((v) => holdsValue(v, token));
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((v) =>
      holdsValue(v, token)
    );
  }
  return false;
}
