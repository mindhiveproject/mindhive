import { useQuery } from "@apollo/client";
import { MY_FAVORITE_TASKS } from "../../Queries/Task";
import useTranslation from "next-translate/useTranslation";

import StyledConnect from "../../styles/StyledConnect";

import TaskCard from "./TaskCard";

export default function FavoriteTasks({ user }) {
  const { t } = useTranslation("home");
  const { data, loading, error } = useQuery(MY_FAVORITE_TASKS);
  const tasks = data?.authenticatedItem?.favoriteTasks || [];

  return (
    <StyledConnect>
      <div>
        <h3>{t("favoriteTasks")}</h3>
        <div className="cards">
          {tasks.map((task) => (
            <TaskCard
              user={user}
              key={task?.id}
              task={task}
              url={user ? "/dashboard/discover/tasks/" : `/tasks/${task?.slug}`}
              id="slug"
              name="name"
              domain="discover"
            />
          ))}
        </div>
      </div>
    </StyledConnect>
  );
}
