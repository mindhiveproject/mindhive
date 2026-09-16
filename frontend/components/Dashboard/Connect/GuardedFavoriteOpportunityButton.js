import useTranslation from "next-translate/useTranslation";

import FavoriteButton from "../../DesignSystem/FavoriteButton";
import Tooltip from "../../DesignSystem/Tooltip";
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

  const addLabel = t("a11y.favorite.add", {}, { default: "Add to favorites" });
  const removeLabel = t(
    "a11y.favorite.remove",
    {},
    { default: "Remove from favorites" },
  );
  const rankingClosedTooltip = t(
    "a11y.favorite.rankingNotOpen",
    {},
    {
      default:
        "Favoriting is only available while ranking preferences are open.",
    },
  );
  const tooltipMessage = disabledProp
    ? rankingClosedTooltip
    : isFavorite
      ? removeLabel
      : addLabel;

  return (
    <>
      <Tooltip content={tooltipMessage}>
        <FavoriteButton
          active={!!isFavorite}
          className={className}
          addLabel={addLabel}
          removeLabel={removeLabel}
          onToggle={toggleFavorite}
          disabled={loading || disabledProp}
          {...buttonProps}
        />
      </Tooltip>
      {conflictModal}
    </>
  );
}
