import useTranslation from "next-translate/useTranslation";
import { useMutation } from "@apollo/client";
import styled from "styled-components";

import IconButton from "../../DesignSystem/IconButton";
import { StarFilledIcon, StarIcon } from "../../DesignSystem/Icons";
import { MANAGE_FAVORITE_PEOPLE } from "../../Mutations/User";
import { CURRENT_USER_QUERY } from "../../Queries/User";

/**
 * Saved and not-saved use different fills so the toggle reads as on/off across
 * a grid of cards, and hover deepens whichever fill is showing.
 *
 * IconButton's tonal hover leaves the fill untouched and only adds a drop
 * shadow, which reads as a smudge on the flat card, so the deepened fill is
 * supplied here — Primary Light → Primary Medium, the same "more ink, same
 * hue" step Material makes with a state layer. Scoped to this button while we
 * try it; if it holds up it belongs in IconButton's TONAL_HOVER. The
 * !important is only because IconButton styles itself inline.
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
    </FavoriteToggle>
  );
}
