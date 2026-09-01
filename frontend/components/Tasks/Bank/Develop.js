import { useState } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { MY_TASKS } from "../../Queries/Task";
import TaskCard from "./TaskCard";
import Chip from "../../DesignSystem/Chip";
import MessageCard from "../../DesignSystem/MessageCard";

const EMPTY_MESSAGE_BY_TYPE = {
  TASK: {
    key: "developTasks.emptyTask",
    default: "No tasks to show.",
  },
  SURVEY: {
    key: "developTasks.emptySurvey",
    default: "No surveys to show.",
  },
  BLOCK: {
    key: "developTasks.emptyBlock",
    default: "No blocks to show.",
  },
};

// These banks are mostly used to get back to items you've starred, not to browse
// everything you've ever authored, so "favorited" is the default view.
const FILTERS = [
  { key: "favorited", labelKey: "developTasks.filterFavorited", default: "Favorited" },
  { key: "public", labelKey: "developTasks.filterPublic", default: "Public" },
  { key: "mine", labelKey: "developTasks.filterCreatedByMe", default: "Created by me" },
];

function buildWhere({ filter, taskType, userId }) {
  const byFilter = {
    favorited: { favoriteBy: { some: { id: { equals: userId } } } },
    public: { public: { equals: true } },
    mine: {
      OR: [
        { author: { id: { equals: userId } } },
        { collaborators: { some: { id: { equals: userId } } } },
      ],
    },
  };
  return {
    AND: [{ taskType: { equals: taskType } }, byFilter[filter]],
  };
}

export default function DevelopTaskBank({ user, taskType }) {
  const { t } = useTranslation("builder");
  const [filter, setFilter] = useState("favorited");

  const { data } = useQuery(MY_TASKS, {
    variables: { where: buildWhere({ filter, taskType, userId: user?.id }) },
  });
  const tasks = data?.tasks || [];
  const emptyCopy =
    EMPTY_MESSAGE_BY_TYPE[taskType] || EMPTY_MESSAGE_BY_TYPE.TASK;

  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          margin: "12px 0 16px",
        }}
      >
        {FILTERS.map((f) => {
          const isSelected = filter === f.key;
          return (
            <Chip
              key={f.key}
              label={t(f.labelKey, {}, { default: f.default })}
              selected={isSelected}
              onClick={() => setFilter(f.key)}
              // Filter-chip affordance: the active non-default chip carries a
              // close icon that clears back to the default (favorited) view.
              onClose={
                isSelected && f.key !== "favorited"
                  ? () => setFilter("favorited")
                  : undefined
              }
            />
          );
        })}
      </div>

      {tasks.length === 0 ? (
        <MessageCard
          variant="neutral"
          message={t(emptyCopy.key, {}, { default: emptyCopy.default })}
        />
      ) : (
        <div className="cardBoard">
          {tasks.map((task) => (
            <TaskCard
              key={task?.id}
              task={task}
              url={`/builder/${taskType?.toLowerCase()}s/`}
              id="id"
              name="selector"
              domain="develop"
            />
          ))}
        </div>
      )}
    </>
  );
}
