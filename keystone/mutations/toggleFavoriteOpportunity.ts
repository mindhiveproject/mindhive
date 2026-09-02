type ToggleFavoriteOpportunityArgs = {
  opportunityId: string;
  confirmRemoveFromDraftRanking?: boolean;
};

export type ToggleFavoriteOpportunityResult = {
  isFavorite: boolean;
  requiresConfirmation: boolean;
  draftPreferenceItemIds: string[];
  draftPreferenceId: string | null;
};

/**
 * Toggle Profile.favoriteOpportunities with draft-ranking awareness.
 * Submitted preference items are never modified.
 */
async function toggleFavoriteOpportunity(
  _root: unknown,
  {
    opportunityId,
    confirmRemoveFromDraftRanking = false,
  }: ToggleFavoriteOpportunityArgs,
  context: any,
): Promise<ToggleFavoriteOpportunityResult> {
  const sessionId = context.session?.itemId;
  if (!sessionId) {
    throw new Error("You must be signed in to update favorites.");
  }

  const oppId = opportunityId == null ? "" : String(opportunityId);
  if (!oppId) {
    throw new Error("opportunityId is required.");
  }

  const profile = await context.sudo().query.Profile.findOne({
    where: { id: sessionId },
    query: `
      id
      favoriteOpportunities { id }
    `,
  });
  if (!profile) {
    throw new Error("Profile not found.");
  }

  const isFavorite = (profile.favoriteOpportunities || []).some(
    (o: { id?: string }) => o?.id === oppId,
  );

  if (!isFavorite) {
    await context.sudo().query.Profile.updateOne({
      where: { id: sessionId },
      data: {
        favoriteOpportunities: { connect: [{ id: oppId }] },
      },
      query: "id",
    });
    return {
      isFavorite: true,
      requiresConfirmation: false,
      draftPreferenceItemIds: [],
      draftPreferenceId: null,
    };
  }

  const draftPreferences = await context.sudo().query.ConnectPreference.findMany({
    where: {
      submitter: { id: { equals: sessionId } },
      status: { equals: "draft" },
    },
    query: `
      id
      items {
        id
        opportunity { id }
      }
    `,
  });

  const draftItems = (draftPreferences || []).flatMap(
    (pref: {
      id?: string;
      items?: Array<{ id?: string; opportunity?: { id?: string } }>;
    }) =>
      (pref.items || []).filter(
        (item) => item?.opportunity?.id === oppId,
      ),
  );

  const draftPreferenceItemIds = draftItems
    .map((item: { id?: string }) => item?.id)
    .filter(Boolean) as string[];
  const draftPreferenceId =
    draftItems.length > 0
      ? (draftPreferences || []).find((pref: {
          items?: Array<{ opportunity?: { id?: string } }>;
        }) =>
          (pref.items || []).some(
            (item) => item?.opportunity?.id === oppId,
          ),
        )?.id ?? null
      : null;

  if (draftPreferenceItemIds.length > 0 && !confirmRemoveFromDraftRanking) {
    return {
      isFavorite: true,
      requiresConfirmation: true,
      draftPreferenceItemIds,
      draftPreferenceId,
    };
  }

  if (draftPreferenceItemIds.length > 0) {
    await context.sudo().query.ConnectPreferenceItem.deleteMany({
      where: draftPreferenceItemIds.map((id) => ({ id })),
    });
  }

  await context.sudo().query.Profile.updateOne({
    where: { id: sessionId },
    data: {
      favoriteOpportunities: { disconnect: [{ id: oppId }] },
    },
    query: "id",
  });

  return {
    isFavorite: false,
    requiresConfirmation: false,
    draftPreferenceItemIds: [],
    draftPreferenceId,
  };
}

export default toggleFavoriteOpportunity;
