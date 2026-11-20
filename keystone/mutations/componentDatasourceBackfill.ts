// Admins: write into every Data Journal component the dataset it shows today
// (lib/componentDatasourceBackfill.js). Dry run by default. Safe to run more
// than once: components that already name one of their journal's datasets
// are left alone.
import { isAdmin } from "../access";
const { planBackfill } = require("../lib/componentDatasourceBackfill");

const BATCH = 200;
const SAMPLE = 20;

export async function backfillComponentDatasources(
  _root: unknown,
  { dryRun = true }: { dryRun?: boolean },
  context: any
) {
  if (!isAdmin({ session: context.session } as any)) {
    throw new Error("Forbidden: admins only.");
  }
  const { counts, updates } = await planBackfill(context.prisma);

  if (!dryRun) {
    const sudo = context.sudo();
    for (let i = 0; i < updates.length; i += BATCH) {
      await sudo.query.VizSection.updateMany({
        data: updates.slice(i, i + BATCH).map((u: any) => ({
          where: { id: u.id },
          data: { content: u.content },
        })),
        query: "id",
      });
    }
  }

  return {
    dryRun,
    counts,
    updated: dryRun ? 0 : updates.length,
    wouldUpdate: updates.length,
    sample: updates
      .slice(0, SAMPLE)
      .map(({ id, reason, datasourceId }: any) => ({ id, reason, datasourceId })),
  };
}
