import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { MY_FAVORITE_TASKS } from "../../Queries/Task";
import TaskCard from "./TaskCard";

export default function FavoriteTasks({ user }) {
  const { t } = useTranslation("home");
  const { data } = useQuery(MY_FAVORITE_TASKS);
  const tasks = data?.authenticatedItem?.favoriteTasks || [];

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 className="MH-Type-Title-Base" style={{ margin: 0, color: "#171717" }}>
        {t("favoriteTasks")}
      </h3>
      {/* Cards at the same ~300px size as the Discover task bank; column count
         follows the width available on the home page. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 10,
        }}
      >
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
    </section>
  );
}
