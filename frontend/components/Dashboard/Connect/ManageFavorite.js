import { Icon } from "semantic-ui-react";
import styled from "styled-components";

import { MANAGE_FAVORITE_PEOPLE } from "../../Mutations/User";
import { CURRENT_USER_QUERY } from "../../Queries/User";

import { useMutation } from "@apollo/client";

const FavoriteButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 100px;
  padding: 8px;
  cursor: pointer;
  background: ${(props) => (props.selected ? "#FDF2D0" : "#EFEFEF")};
  transition: background 0.2s ease;

  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    line-height: 1;
  }

  .star-icon {
    color: ${(props) => (props.selected ? "#F2BE42" : "#625B71")} !important;
    font-size: 19px !important;
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    vertical-align: middle !important;
  }
`;

export default function ManageFavorite({ user, profileId }) {
  const isFavorite = user?.favoritePeople.map((t) => t?.id).includes(profileId);

  const [manageFavorite] = useMutation(MANAGE_FAVORITE_PEOPLE, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  return (
    <FavoriteButton
      selected={isFavorite}
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
      <div className="icon-wrapper">
        <Icon name="star" className="star-icon" />
      </div>
    </FavoriteButton>
  );
}
