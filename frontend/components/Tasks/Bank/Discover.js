import { useContext, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import { PUBLIC_TASKS } from "../../Queries/Task";
import TaskCard from "./TaskCard";
import TaskDescriptionsExport from "./DescriptionsExport";
import { UserContext } from "../../Global/Authorized";
import Button from "../../DesignSystem/Button";
import MessageCard from "../../DesignSystem/MessageCard";
import Chip from "../../DesignSystem/Chip";
import Input from "../../DesignSystem/Input";
import { buildTaskBankWhere } from "../../../lib/taskBankFilter";

import { StyledDiscover } from "../../styles/StyledDiscover";
import useTranslation from "next-translate/useTranslation";

// Type filter chips, in display order; `value` is the `?tab=` URL value.
const TYPE_FILTERS = [
  { value: "all", labelKey: "all", taskType: null },
  { value: "task", labelKey: "tasks", taskType: "TASK" },
  { value: "survey", labelKey: "surveys", taskType: "SURVEY" },
  { value: "block", labelKey: "blocks", taskType: "BLOCK" },
];

// Title (localized and original) and the card subtitle, lower-cased.
function searchableText(task, locale) {
  return [
    task?.i18nContent?.[locale]?.title,
    task?.title,
    task?.i18nContent?.[locale]?.settings?.addInfo,
    task?.settings?.addInfo,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function DiscoverTaskBank({ query, user, isDashboard }) {
  const { t } = useTranslation("home");
  const router = useRouter();
  const tab = TYPE_FILTERS.some((f) => f.value === query?.tab)
    ? query.tab
    : "all";
  const [search, setSearch] = useState("");
  // Wait until we know whether someone is signed in, so a signed-in user never
  // flashes the signed-out preview (and its query) first.
  const { loading: userLoading } = useContext(UserContext);

  // One query for every type; the type chips and search filter it locally so
  // each chip can show its count and switching chips needs no refetch.
  const { data, error, loading } = useQuery(PUBLIC_TASKS, {
    variables: { where: buildTaskBankWhere({ user }) },
    skip: userLoading,
  });
  const allTasks = useMemo(() => data?.tasks || [], [data]);
  const isPreview = !user && !userLoading;

  const countByType = useMemo(() => {
    const counts = { all: allTasks.length };
    TYPE_FILTERS.forEach((f) => {
      if (f.taskType) {
        counts[f.value] = allTasks.filter(
          (task) => task?.taskType === f.taskType
        ).length;
      }
    });
    return counts;
  }, [allTasks]);

  const tasks = useMemo(() => {
    const { taskType } = TYPE_FILTERS.find((f) => f.value === tab);
    const term = search.trim().toLowerCase();
    return allTasks.filter(
      (task) =>
        (!taskType || task?.taskType === taskType) &&
        (!term || searchableText(task, router.locale).includes(term))
    );
  }, [allTasks, tab, search, router.locale]);

  const setTab = (next) => {
    router.push(
      {
        pathname: `${isDashboard ? "/dashboard" : ""}/discover/task`,
        query: next === "all" ? {} : { tab: next },
      },
      undefined,
      { scroll: false }
    );
  };

  return (
    <StyledDiscover>
      {isPreview && (
        <div className="repositoryNotice">
          <div className="repositoryNoticeText">
            <span className="MH-Type-Title-Base">
              {t(
                "taskBankPreview.title",
                {},
                {
                  default:
                    "You're viewing a selection of featured tasks and surveys",
                }
              )}
            </span>
            <span className="MH-Type-Body-Base">
              {t(
                "taskBankPreview.message",
                {},
                {
                  default:
                    "Log in or sign up to access the full repository of tasks and surveys.",
                }
              )}
            </span>
          </div>
          <div className="repositoryNoticeActions">
            <Link href="/login">
              <Button variant="outline">
                {t("taskBankPreview.login", {}, { default: "Log in" })}
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="filled">
                {t("taskBankPreview.signup", {}, { default: "Sign up" })}
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="filterHeader">
        <div
          className="typeFilters"
          role="group"
          aria-label={t(
            "taskBankFilters.typeLabel",
            {},
            {
              default: "Filter by type",
            }
          )}
        >
          {TYPE_FILTERS.map((f) => {
            const isSelected = tab === f.value;
            return (
              <Chip
                key={f.value}
                label={`${t(f.labelKey)} (${countByType[f.value] ?? 0})`}
                selected={isSelected}
                onClick={() => setTab(f.value)}
                // Same affordance as the builder's task bank: the active
                // non-default chip clears back to "All".
                onClose={
                  isSelected && f.value !== "all"
                    ? () => setTab("all")
                    : undefined
                }
              />
            );
          })}
        </div>

        <div className="searchAndActions">
          <div className="taskSearch">
            <Input
              type="search"
              value={search}
              onChange={setSearch}
              placeholder={t(
                "taskBankFilters.searchPlaceholder",
                {},
                {
                  default: "Search tasks and surveys",
                }
              )}
              aria-label={t(
                "taskBankFilters.searchPlaceholder",
                {},
                {
                  default: "Search tasks and surveys",
                }
              )}
            />
          </div>
          <TaskDescriptionsExport user={user} tasks={allTasks} />
        </div>
      </div>
      {!userLoading && !loading && !error && tasks.length === 0 && (
        <MessageCard
          variant="neutral"
          message={
            allTasks.length === 0
              ? t(
                  "taskBankEmpty",
                  {},
                  {
                    default: "No tasks or surveys to show here yet.",
                  }
                )
              : t(
                  "taskBankNoMatches",
                  {},
                  {
                    default: "No tasks or surveys match these filters.",
                  }
                )
          }
        />
      )}

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
