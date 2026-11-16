import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { MY_TASKS } from "../../Queries/Task";
import { PENDING_TASK_SHARES_COUNT } from "../../Queries/TaskShare";
import TaskCard from "./TaskCard";
import SharedWithMe from "./SharedWithMe";
import ShareTaskModal from "../Share/ShareTaskModal";
import { blockRelation } from "../../../lib/blockOwnership";
import Chip from "../../DesignSystem/Chip";
import MessageCard from "../../DesignSystem/MessageCard";
import LoadingIcon from "../../DesignSystem/LoadingIcon";
import useHiddenTaskIds from "./useHiddenTaskIds";
import { excludeHiddenTasks } from "../../../lib/taskBankFilter";

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
  {
    key: "favorited",
    labelKey: "developTasks.filterFavorited",
    default: "Favorited",
  },
  { key: "public", labelKey: "developTasks.filterPublic", default: "Public" },
  {
    key: "mine",
    labelKey: "developTasks.filterCreatedByMe",
    default: "Created by me",
  },
  // copies people in your classes offered you (Tasks/Share)
  {
    key: "shared",
    labelKey: "developTasks.filterSharedWithMe",
    default: "Shared with me",
  },
];
const FILTER_KEYS = FILTERS.map((f) => f.key);

function buildWhere({ filter, taskType, userId, hiddenTaskIds }) {
  const byFilter = {
    favorited: { favoriteBy: { some: { id: { equals: userId } } } },
    // Browsing public tasks respects the student's class block lists.
    public: excludeHiddenTasks({ public: { equals: true } }, hiddenTaskIds),
    // originals only: a study's own copies of a task stay in that study
    mine: {
      copiedFrom: null,
      OR: [
        { author: { id: { equals: userId } } },
        { collaborators: { some: { id: { equals: userId } } } },
      ],
    },
  };
  return {
    AND: [{ taskType: { equals: taskType } }, byFilter[filter] || {}],
  };
}

export default function DevelopTaskBank({ user, taskType }) {
  const { t } = useTranslation("builder");
  const router = useRouter();
  // ?filter=shared opens a list directly (the "shared with you" notification)
  const linkedFilter = FILTER_KEYS.includes(router.query?.filter)
    ? router.query.filter
    : null;
  const [filter, setFilter] = useState(linkedFilter || "favorited");
  useEffect(() => {
    if (linkedFilter) setFilter(linkedFilter);
  }, [linkedFilter]);
  const [sharing, setSharing] = useState(null);
  const hiddenTaskIds = useHiddenTaskIds();

  const isShared = filter === "shared";
  const { data, loading } = useQuery(MY_TASKS, {
    variables: {
      where: buildWhere({ filter, taskType, userId: user?.id, hiddenTaskIds }),
    },
    skip: isShared,
  });
  const { data: pendingData } = useQuery(PENDING_TASK_SHARES_COUNT, {
    variables: { me: user?.id, taskType },
    skip: !user?.id,
    fetchPolicy: "cache-and-network",
  });
  const pendingCount = pendingData?.taskShareInvitesCount || 0;
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
          const label = t(f.labelKey, {}, { default: f.default });
          return (
            <Chip
              key={f.key}
              label={
                f.key === "shared" && pendingCount > 0
                  ? `${label} (${pendingCount})`
                  : label
              }
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

      {isShared ? (
        <SharedWithMe user={user} taskType={taskType} />
      ) : loading && !data ? (
        <MessageCard
          variant="neutral"
          message={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <LoadingIcon size={20} />
              {t("developTasks.loading", {}, { default: "Loading…" })}
            </span>
          }
        />
      ) : tasks.length === 0 ? (
        <MessageCard
          variant="neutral"
          message={t(emptyCopy.key, {}, { default: emptyCopy.default })}
        />
      ) : (
        <div className="cardBoard">
          {tasks.map((task) => (
            <TaskCard
              key={task?.id}
              viewer={user}
              task={task}
              url={`/builder/${taskType?.toLowerCase()}s/`}
              id="id"
              name="selector"
              domain="develop"
              onShare={
                blockRelation(task, user?.id) && !task?.copiedFrom?.id
                  ? setSharing
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <ShareTaskModal
        open={!!sharing}
        onClose={() => setSharing(null)}
        task={sharing}
        user={user}
      />
    </>
  );
}
