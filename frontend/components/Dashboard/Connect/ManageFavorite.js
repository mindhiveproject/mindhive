import useTranslation from "next-translate/useTranslation";
import { useMutation } from "@apollo/client";

import FavoriteButton from "../../DesignSystem/FavoriteButton";
import { MANAGE_FAVORITE_PEOPLE } from "../../Mutations/User";
import { CURRENT_USER_QUERY } from "../../Queries/User";

export default function ManageFavorite({ user, profileId }) {
  const { t } = useTranslation("connect");
  const isFavorite = user?.favoritePeople
    ?.map((person) => person?.id)
    .includes(profileId);

  const [manageFavorite] = useMutation(MANAGE_FAVORITE_PEOPLE, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

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
        await manageFavorite({
          variables: {
            id: user?.id,
            action: {
              [isFavorite ? "disconnect" : "connect"]: { id: profileId },
            },
          },
        });
      }}
    />
  );
}
