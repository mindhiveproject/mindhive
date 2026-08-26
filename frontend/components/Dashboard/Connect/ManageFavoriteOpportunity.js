import useTranslation from "next-translate/useTranslation";
import { useMutation } from "@apollo/client";
import styled from "styled-components";

import IconButton from "../../DesignSystem/IconButton";
import { StarFilledIcon, StarIcon } from "../../DesignSystem/Icons";
import { TOGGLE_FAVORITE_OPPORTUNITY } from "../../Mutations/Opportunity";
import { CURRENT_USER_QUERY } from "../../Queries/User";

/**
 * Same star toggle as Connect profile cards, wired to Profile.favoriteOpportunities.
 */
const FavoriteToggle = styled.span`
  display: inline-flex;

  .DesignSystem-IconButton:hover {
    background: ${({ $favorite }) =>
      $favorite
        ? "var(--MH-Theme-Primary-Medium, #a3d6db)"
        : "var(--MH-Theme-Neutrals-Light, #e6e6e6)"} !important;
  }
`;

export default function ManageFavoriteOpportunity({ user, opportunityId }) {
  const { t } = useTranslation("connect");
  const isFavorite = user?.favoriteOpportunities
    ?.map((opportunity) => opportunity?.id)
    .includes(opportunityId);

  const [toggleFavorite] = useMutation(TOGGLE_FAVORITE_OPPORTUNITY, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  const label = isFavorite
    ? t("a11y.favorite.remove", {}, { default: "Remove from favorites" })
    : t("a11y.favorite.add", {}, { default: "Add to favorites" });

  if (!user?.id || !opportunityId) {
    return null;
  }

  return (
    <FavoriteToggle $favorite={isFavorite}>
      <IconButton
        variant={isFavorite ? "tonal" : "subtle"}
        elevated={false}
        icon={isFavorite ? <StarFilledIcon /> : <StarIcon />}
        ariaLabel={label}
        aria-pressed={isFavorite}
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await toggleFavorite({
            variables: {
              profileId: user.id,
              input: {
                favoriteOpportunities: isFavorite
                  ? { disconnect: [{ id: opportunityId }] }
                  : { connect: [{ id: opportunityId }] },
              },
            },
          });
        }}
      />
    </FavoriteToggle>
  );
}
