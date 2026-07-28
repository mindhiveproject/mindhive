import useTranslation from "next-translate/useTranslation";
import { useMutation } from "@apollo/client";

import IconButton from "../../DesignSystem/IconButton";
import { MANAGE_FAVORITE_PEOPLE } from "../../Mutations/User";
import { CURRENT_USER_QUERY } from "../../Queries/User";

function StarIcon({ filled }) {
  return (
    <img
      src={
        filled
          ? "/assets/icons/builder/medium-star-filled.svg"
          : "/assets/icons/builder/medium-star.svg"
      }
      alt=""
      width={24}
      height={24}
      aria-hidden
    />
  );
}

export default function ManageFavorite({ user, profileId }) {
  const { t } = useTranslation("connect");
  const isFavorite = user?.favoritePeople
    ?.map((person) => person?.id)
    .includes(profileId);

  const [manageFavorite] = useMutation(MANAGE_FAVORITE_PEOPLE, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  const label = isFavorite
    ? t("a11y.favorite.remove", {}, { default: "Remove from favorites" })
    : t("a11y.favorite.add", {}, { default: "Add to favorites" });

  return (
    <IconButton
      variant="tonal"
      icon={<StarIcon filled={isFavorite} />}
      ariaLabel={label}
      aria-pressed={isFavorite}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
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
