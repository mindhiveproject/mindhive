import { GET_PARTICIPATE_VIEW } from "../../Queries/ConnectPreference";
import GuardedFavoriteOpportunityButton from "./GuardedFavoriteOpportunityButton";

/**
 * Star toggle wired to Profile.favoriteOpportunities with draft-ranking guard.
 */
export default function ManageFavoriteOpportunity({
  user,
  opportunityId,
  roundId = null,
  hasDraftRanking = false,
  refetchQueries: extraRefetchQueries = [],
}) {
  const isFavorite = user?.favoriteOpportunities
    ?.map((opportunity) => opportunity?.id)
    .includes(opportunityId);

  const refetchQueries = [
    ...(roundId
      ? [{ query: GET_PARTICIPATE_VIEW, variables: { roundId } }]
      : []),
    ...extraRefetchQueries,
  ];

  if (!user?.id || !opportunityId) {
    return null;
  }

  return (
    <GuardedFavoriteOpportunityButton
      opportunityId={opportunityId}
      isFavorite={!!isFavorite}
      hasDraftRanking={hasDraftRanking}
      refetchQueries={refetchQueries}
      data-card-action
    />
  );
}
