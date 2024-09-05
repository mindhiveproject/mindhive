import { Icon } from "semantic-ui-react";

import { MANAGE_FAVORITE_TASKS } from "../Mutations/User";
import { CURRENT_USER_QUERY } from "../Queries/User";
import { FAVORITE_TASKS } from "../Queries/Task";

import { useMutation } from "@apollo/client";

export default function ManageFavorite({ user, search, componentType, id }) {
  const isFavorite = user?.favoriteTasks.map((t) => t?.id).includes(id);

  const [manageFavorite] = useMutation(MANAGE_FAVORITE_TASKS, {
    refetchQueries: [
      { query: CURRENT_USER_QUERY },
      {
        query: FAVORITE_TASKS,
        variables: {
          taskType: componentType,
          searchTerm: search,
          userId: user?.id,
        },
      },
    ],
  });

  return (
    <div
      onClick={async (e) => {
        e.preventDefault();
        await manageFavorite({
          variables: {
            id: user?.id,
            taskAction: { [isFavorite ? "disconnect" : "connect"]: { id } },
          },
        });
      }}
    >
      {isFavorite ? (
        <Icon name="favorite" color="yellow" />
      ) : (
        <Icon name="favorite" color="grey" />
      )}
    </div>
  );
}
