import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { PUBLIC_TASKS } from "../../Queries/Task";
import TaskCard from "./TaskCard";

import { Dropdown } from "semantic-ui-react";
import { StyledDiscover } from "../../styles/StyledDiscover";

export default function DiscoverTaskBank({ query, user, isDashboard }) {
  const router = useRouter();
  const tab = query?.tab || "all";

  const { data, error, loading } = useQuery(PUBLIC_TASKS, {
    variables: {
      taskType: tab === "all" ? undefined : tab.toUpperCase(),
    },
  });
  const tasks = data?.tasks || [];

  const setTab = (tab) => {
    router.push({
      pathname: `${isDashboard ? "/dashboard" : ""}/discover/task`,
      query: {
        tab,
      },
    });
  };

  return (
    <StyledDiscover>
      <div className="filterHeader">
        <div>
          <Dropdown
            selection
            options={[
              {
                key: "all",
                text: "All",
                value: "all",
              },
              {
                key: "task",
                text: "Tasks",
                value: "task",
              },
              {
                key: "survey",
                text: "Surveys",
                value: "survey",
              },
              {
                key: "block",
                text: "Blocks",
                value: "block",
              },
            ]}
            onChange={(event, data) => setTab(data?.value)}
            value={tab}
            className="createdByDropdown"
          />
        </div>

        <div>
          <a
            target="_blank"
            href="https://docs.google.com/document/d/1PjobN7C3LUDuiFUanZd7BuTGYRf5zq9t_CUGGKQjLyM/edit?usp=sharing"
            rel="noreferrer"
          >
            <button>Tasks and Surveys descriptions</button>
          </a>
        </div>
      </div>
      <div className="tasks">
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
    </StyledDiscover>
  );
}
