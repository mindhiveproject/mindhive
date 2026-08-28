import useTranslation from "next-translate/useTranslation";
import { useMutation } from "@apollo/client";

import FavoriteButton from "../../DesignSystem/FavoriteButton";
import { TOGGLE_FAVORITE_OPPORTUNITY } from "../../Mutations/Opportunity";
import { CURRENT_USER_QUERY } from "../../Queries/User";

/**
 * Star toggle wired to Profile.favoriteOpportunities. Same DS FavoriteButton as
 * every other favourite star on the platform.
 */
export default function ManageFavoriteOpportunity({ user, opportunityId }) {
  const { t } = useTranslation("connect");
  const isFavorite = user?.favoriteOpportunities
    ?.map((opportunity) => opportunity?.id)
    .includes(opportunityId);

  const [toggleFavorite] = useMutation(TOGGLE_FAVORITE_OPPORTUNITY, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  if (!user?.id || !opportunityId) {
    return null;
  }

  return (
    <FavoriteButton
      active={!!isFavorite}
      data-card-action
      addLabel={t("a11y.favorite.add", {}, { default: "Add to favorites" })}
      removeLabel={t(
        "a11y.favorite.remove",
        {},
        { default: "Remove from favorites" }
      )}
      onToggle={async () => {
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
  );
}
