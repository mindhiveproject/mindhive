import { useMutation } from "@apollo/client";
import { Icon } from "semantic-ui-react";

import { MANAGE_FAVORITE_TASKS } from "../Mutations/User";
import { CURRENT_USER_QUERY } from "../Queries/User";
import { FAVORITE_TASKS, buildFavoriteTasksWhere } from "../Queries/Task";

export default function ManageFavorite({
  user,
  search,
  componentType,
  id,
  render,
}) {
  const isFavorite = user?.favoriteTasks?.map((t) => t?.id).includes(id);

  const favoriteTasksVariables = {
    where: buildFavoriteTasksWhere({
      userId: user?.id,
      componentType,
      search: search || "",
    }),
  };

  const [manageFavorite] = useMutation(MANAGE_FAVORITE_TASKS, {
    refetchQueries: [
      { query: CURRENT_USER_QUERY },
      { query: FAVORITE_TASKS, variables: favoriteTasksVariables },
    ],
    awaitRefetchQueries: true,
  });

  const onToggle = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    await manageFavorite({
      variables: {
        id: user?.id,
        taskAction: { [isFavorite ? "disconnect" : "connect"]: { id } },
      },
    });
  };

  if (typeof render === "function") {
    return render({ isFavorite, onToggle });
  }

  return (
    <div onClick={onToggle}>
      {isFavorite ? (
        <Icon name="favorite" color="yellow" />
      ) : (
        <Icon name="favorite" color="grey" />
      )}
    </div>
  );
}
