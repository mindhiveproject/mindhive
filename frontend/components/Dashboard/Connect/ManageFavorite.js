import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import { MANAGE_FAVORITE_PEOPLE } from "../../Mutations/User";
import { CURRENT_USER_QUERY } from "../../Queries/User";

import { useMutation } from "@apollo/client";

function StarIcon({ filled }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill={filled ? "#F2BE42" : "none"}
      stroke={filled ? "#F2BE42" : "#625B71"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

const FavoriteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 100px;
  padding: 8px;
  border: none;
  cursor: pointer;
  background: ${(props) => (props.$selected ? "#FDF2D0" : "#EFEFEF")};
  transition: background 0.2s ease;

  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    line-height: 1;
  }

  &:focus-visible {
    outline: 2px solid #336f8a;
    outline-offset: 2px;
  }
`;

export default function ManageFavorite({ user, profileId }) {
  const { t } = useTranslation("connect");
  const isFavorite = user?.favoritePeople
    .map((person) => person?.id)
    .includes(profileId);

  const [manageFavorite] = useMutation(MANAGE_FAVORITE_PEOPLE, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  const label = isFavorite
    ? t("a11y.favorite.remove", {}, { default: "Remove from favorites" })
    : t("a11y.favorite.add", {}, { default: "Add to favorites" });

  return (
    <FavoriteButton
      type="button"
      $selected={isFavorite}
      aria-label={label}
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
    >
      <span className="icon-wrapper">
        <StarIcon filled={isFavorite} />
      </span>
    </FavoriteButton>
  );
}
