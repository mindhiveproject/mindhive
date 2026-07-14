import {
  multiselectNeedsNormalization,
  normalizedMultiselectForStorage,
} from "../lib/normalizeMultiselect";

type BackfillArgs = {
  limit?: number;
  dryRun?: boolean;
};

const MULTISELECT_COLUMNS = ["preferGradeLevels", "preferClassType"] as const;

export default async function backfillOpportunityMultiselectFields(
  _root: unknown,
  args: BackfillArgs,
  context: any
): Promise<number> {
  const limit = Math.min(Math.max(args?.limit ?? 500, 1), 5000);
  const dryRun = args?.dryRun ?? false;

  const rows = await context.prisma.opportunity.findMany({
    take: limit,
    select: {
      id: true,
      preferGradeLevels: true,
      preferClassType: true,
    },
  });

  let updated = 0;

  for (const row of rows) {
    const data: Record<string, string[]> = {};
    for (const key of MULTISELECT_COLUMNS) {
      const raw = row[key];
      if (!multiselectNeedsNormalization(raw)) continue;
      data[key] = normalizedMultiselectForStorage(raw);
    }
    if (!Object.keys(data).length) continue;

    if (!dryRun) {
      await context.db.Opportunity.updateOne({
        where: { id: row.id },
        data,
      });
    }
    updated += 1;
  }

  return updated;
}
