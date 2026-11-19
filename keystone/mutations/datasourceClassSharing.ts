// Teacher-controlled class visibility for Data Journal datasets, and the
// one-off backfill of the explicit public flag. Who sees which dataset is
// decided in lib/datasourceAccess.js; these mutations only change the two
// fields it reads, `sharedWithClasses` and `isPublic`, which plain updates
// cannot set.
import { isAdmin, staffClassIds } from "../access";

type SharingArgs = {
  datasourceIds: string[];
  classId: string;
  shared: boolean;
};

const MAX_DATASOURCES = 500;

/**
 * Share datasets with a class, or stop sharing them. The caller must staff the
 * class (creator, co-teacher, mentor) or be an admin, and can only share
 * datasets they can read themselves. Returns how many datasets changed.
 */
export async function setDatasourceClassSharing(
  _root: unknown,
  { datasourceIds, classId, shared }: SharingArgs,
  context: any
): Promise<number> {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in to share datasets.");
  }
  const admin = isAdmin({ session } as any);
  if (!admin) {
    const staffed = await staffClassIds(context);
    if (!staffed.includes(String(classId))) {
      throw new Error("Only the class's teachers can share datasets with it.");
    }
  }

  const wanted = [...new Set((datasourceIds || []).filter(Boolean))].slice(
    0,
    MAX_DATASOURCES
  );
  if (!wanted.length) return 0;

  // Read as the caller, so the dataset read rule decides what they may share.
  const readable = await context.query.Datasource.findMany({
    where: { id: { in: wanted } },
    query: "id",
  });

  const relation = shared
    ? { connect: [{ id: classId }] }
    : { disconnect: [{ id: classId }] };
  await context.sudo().query.Datasource.updateMany({
    data: readable.map((row: { id: string }) => ({
      where: { id: row.id },
      data: { sharedWithClasses: relation },
    })),
    query: "id",
  });
  return readable.length;
}

/**
 * Set `isPublic` on datasets attached to a public template journal, which is
 * how "public" was inferred before the flag existed. Admins only. Dry run by
 * default; returns the ids that change (or would).
 */
export async function backfillPublicDatasources(
  _root: unknown,
  { dryRun = true }: { dryRun?: boolean },
  context: any
): Promise<string[]> {
  if (!isAdmin({ session: context.session } as any)) {
    throw new Error("Forbidden: admins only.");
  }
  const rows = await context.sudo().query.Datasource.findMany({
    where: {
      isPublic: { equals: false },
      journal: {
        some: {
          isPublic: { equals: true },
          isTemplate: { equals: true },
        },
      },
    },
    query: "id",
  });
  const ids = rows.map((row: { id: string }) => row.id);
  if (!dryRun && ids.length) {
    await context.sudo().query.Datasource.updateMany({
      data: ids.map((id: string) => ({
        where: { id },
        data: { isPublic: true },
      })),
      query: "id",
    });
  }
  return ids;
}
