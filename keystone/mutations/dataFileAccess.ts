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

const { contentFileTokens } = require("../lib/datasourceFiles");

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Whether the caller may read a Data Journal file of this datasource: they
 * can read the datasource, and the token is one of its file addresses
 * (content.*.address.token — lib/datasourceFiles.js). New addresses are
 * checked when written (fileTokensRefused), so a dataset can only point at a
 * fresh upload, a public/template file, or a file of a dataset its author edits.
 */
export async function canReadDatasourceFile(
  root: any,
  { datasourceId, token }: { datasourceId: string; token: string },
  context: any
): Promise<boolean> {
  if (!context.session?.itemId || !datasourceId || !token) return false;
  // as the caller: the dataset read rule applies
  const datasource = await context.db.Datasource.findOne({
    where: { id: datasourceId },
  });
  if (!datasource) return false;
  return contentFileTokens(datasource.content).has(token);
}

/**
 * Whether the caller may replace a Data Journal file of this datasource:
 * they may edit it in place (its author, or a collaborator while
 * collaboratorsCanEdit is on), the token is one of its file addresses, and
 * they may edit every other dataset that reads the same file.
 * frontend/pages/api/journal-data.ts asks before overwriting a file.
 */
export async function canWriteDatasourceFile(
  root: any,
  { datasourceId, token }: { datasourceId: string; token: string },
  context: any
): Promise<boolean> {
  const me = context.session?.itemId ? String(context.session.itemId) : null;
  if (!me || !datasourceId || !token || !TOKEN_PATTERN.test(token)) return false;
  // the named dataset must be theirs to edit and point at the file...
  const rows = await context.db.Datasource.findMany({
    where: {
      AND: [{ id: { equals: String(datasourceId) } }, editableByWhere(me)],
    },
  });
  if (!rows.length || !contentFileTokens(rows[0].content).has(token)) {
    return false;
  }
  // ...and so must every other dataset reading that file: a template copy or
  // an old clone shares its source's file, which it must not overwrite
  const holders = await datasourcesHoldingToken(context, token);
  const editable = await context.query.Datasource.count({
    where: { AND: [{ id: { in: holders } }, editableByWhere(me)] },
  });
  return editable === holders.length;
}

/** Ids of every dataset whose file addresses include `token`. */
async function datasourcesHoldingToken(
  context: any,
  token: string
): Promise<string[]> {
  // content is JSON on Postgres and text on SQLite: match its text, then keep
  // only datasets that hold the token at a real address
  const rows: Array<{ id: string; content: unknown }> =
    await context.prisma.$queryRawUnsafe(
      'SELECT "id", "content" FROM "Datasource" WHERE CAST("content" AS TEXT) LIKE $1',
      `%${token}%`
    );
  return rows
    .filter((row) => contentFileTokens(row.content).has(token))
    .map((row) => String(row.id));
}

/** The where-clause for datasets `me` edits in place. */
function editableByWhere(me: string) {
  return {
    OR: [
      { author: { id: { equals: me } } },
      {
        AND: [
          { collaboratorsCanEdit: { equals: true } },
          { collaborators: { some: { id: { equals: me } } } },
        ],
      },
    ],
  };
}

/**
 * The file tokens among `tokens` a dataset may not newly point at. A token is
 * refused when it names a study run file (the Dataset list), or when other
 * datasets already point at it and none of them is public, a template, or
 * one the caller edits. A token no dataset uses yet is a fresh upload.
 */
export async function fileTokensRefused(
  context: any,
  tokens: string[],
  excludeDatasourceId?: string | null
): Promise<string[]> {
  const refused: string[] = [];
  const sudo = context.sudo();
  for (const token of [...new Set(tokens)]) {
    if (!TOKEN_PATTERN.test(token)) {
      refused.push(token);
      continue;
    }
    const runFiles = await sudo.query.Dataset.count({
      where: { token: { equals: token } },
    });
    if (runFiles) {
      refused.push(token);
      continue;
    }
    const holders = (await datasourcesHoldingToken(context, token)).filter(
      (id) => id !== String(excludeDatasourceId ?? "")
    );
    if (!holders.length) continue;
    // Reusing an existing file is for template copies (a public or template
    // dataset's file) and for the caller's own datasets (ones they edit).
    // Pointing at a class-shared or team dataset's file would keep reading
    // its live edits after the sharing ends, so a copy takes a snapshot.
    const me = String(context.session?.itemId ?? "");
    const reusable = await context.query.Datasource.count({
      where: {
        AND: [
          { id: { in: holders } },
          {
            OR: [
              { isPublic: { equals: true } },
              { journal: { some: { isTemplate: { equals: true } } } },
              ...editableByWhere(me).OR,
            ],
          },
        ],
      },
    });
    if (!reusable) refused.push(token);
  }
  return refused;
}
