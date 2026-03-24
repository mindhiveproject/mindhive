type BackfillArgs = {
  limit?: number;
};

const SOURCE_TO_OWNER_FIELD: Record<string, string> = {
  projectCard: "createdInCard",
  proposalCard: "createdInCard",
  board: "createdInBoard",
  proposalBoard: "createdInBoard",
  vizSection: "createdInVizSection",
  resource: "createdInResource",
  resourceContent: "createdInResource",
  study: "createdInStudy",
  assignment: "createdInAssignment",
  profile: "createdInProfile",
};

export default async function backfillMediaAssetOrigins(
  root: unknown,
  args: BackfillArgs,
  context: any
): Promise<number> {
  const limit = Math.min(Math.max(args?.limit ?? 500, 1), 2000);
  const mediaAssets = await context.query.MediaAsset.findMany({
    take: limit,
    query: `
      id
      settings
      createdInBoard { id }
      createdInCard { id }
      createdInVizSection { id }
      createdInResource { id }
      createdInStudy { id }
      createdInAssignment { id }
      createdInProfile { id }
    `,
  });

  let updated = 0;

  for (const asset of mediaAssets || []) {
    const hasOwner =
      asset?.createdInBoard?.id ||
      asset?.createdInCard?.id ||
      asset?.createdInVizSection?.id ||
      asset?.createdInResource?.id ||
      asset?.createdInStudy?.id ||
      asset?.createdInAssignment?.id ||
      asset?.createdInProfile?.id;

    if (hasOwner) continue;

    const sourceType =
      typeof asset?.settings?.sourceType === "string"
        ? asset.settings.sourceType.trim()
        : "";
    const sourceId =
      typeof asset?.settings?.sourceId === "string"
        ? asset.settings.sourceId.trim()
        : "";
    const targetField = SOURCE_TO_OWNER_FIELD[sourceType];

    if (!targetField || !sourceId) continue;

    try {
      await context.db.MediaAsset.updateOne({
        where: { id: asset.id },
        data: {
          [targetField]: {
            connect: { id: sourceId },
          },
        },
      });
      updated += 1;
    } catch (error) {
      // Ignore rows pointing to deleted or mismatched records.
    }
  }

  return updated;
}
