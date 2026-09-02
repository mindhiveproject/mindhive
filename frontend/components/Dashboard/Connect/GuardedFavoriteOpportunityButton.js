import useTranslation from "next-translate/useTranslation";

import FavoriteButton from "../../DesignSystem/FavoriteButton";
import useToggleFavoriteOpportunity from "./useToggleFavoriteOpportunity";

/**
 * Favorite star with draft-ranking guard and confirmation modal.
 */
export default function GuardedFavoriteOpportunityButton({
  opportunityId,
  isFavorite = false,
  hasDraftRanking = false,
  refetchQueries = [],
  onAfterToggle,
  className,
  disabled: disabledProp = false,
  ...buttonProps
}) {
  const { t } = useTranslation("connect");
  const { toggleFavorite, loading, conflictModal } = useToggleFavoriteOpportunity({
    opportunityId,
    isFavorite,
    hasDraftRanking,
    refetchQueries,
    onAfterToggle,
  });

  if (!opportunityId) {
    return null;
  }

  return (
    <>
      <FavoriteButton
        active={!!isFavorite}
        className={className}
        addLabel={t("a11y.favorite.add", {}, { default: "Add to favorites" })}
        removeLabel={t(
          "a11y.favorite.remove",
          {},
          { default: "Remove from favorites" },
        )}
        onToggle={toggleFavorite}
        disabled={loading || disabledProp}
        {...buttonProps}
      />
      {conflictModal}
    </>
  );
}
