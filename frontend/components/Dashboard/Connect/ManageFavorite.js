import { Icon } from "semantic-ui-react";

import { MANAGE_FAVORITE_PEOPLE } from "../../Mutations/User";
import { CURRENT_USER_QUERY } from "../../Queries/User";

import { useMutation } from "@apollo/client";

export default function ManageFavorite({ user, profileId }) {
  const isFavorite = user?.favoritePeople.map((t) => t?.id).includes(profileId);

  const [manageFavorite] = useMutation(MANAGE_FAVORITE_PEOPLE, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  return (
    <div
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
      {isFavorite ? (
        <Icon size="large" name="favorite" color="yellow" />
      ) : (
        <Icon size="large" name="favorite" color="grey" />
      )}
    </div>
  );
}
