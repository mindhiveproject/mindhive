import { useContext } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import { PUBLIC_TASKS } from "../../Queries/Task";
import TaskCard from "./TaskCard";
import { UserContext } from "../../Global/Authorized";
import Button from "../../DesignSystem/Button";
import MessageCard from "../../DesignSystem/MessageCard";
import { buildTaskBankWhere } from "../../../lib/taskBankFilter";

import { Dropdown } from "semantic-ui-react";
import { StyledDiscover } from "../../styles/StyledDiscover";
import useTranslation from "next-translate/useTranslation";

export default function DiscoverTaskBank({ query, user, isDashboard }) {
  const { t } = useTranslation("home");
  const router = useRouter();
  const tab = query?.tab || "all";
  // Wait until we know whether someone is signed in, so a signed-in user never
  // flashes the signed-out preview (and its query) first.
  const { loading: userLoading } = useContext(UserContext);

  const { data, error, loading } = useQuery(PUBLIC_TASKS, {
    variables: {
      where: buildTaskBankWhere({
        user,
        taskType: tab === "all" ? null : tab.toUpperCase(),
      }),
    },
    skip: userLoading,
  });
  const tasks = data?.tasks || [];
  const isPreview = !user && !userLoading;

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
        <div>
          <Dropdown
            selection
            options={[
              {
                key: "all",
                text: t("all"),
                value: "all",
              },
              {
                key: "task",
                text: t("tasks"),
                value: "task",
              },
              {
                key: "survey",
                text: t("surveys"),
                value: "survey",
              },
              {
                key: "block",
                text: t("blocks"),
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
            <button>{t("tasksAndSurveysDescriptions")}</button>
          </a>
        </div>
      </div>
      {!userLoading && !loading && !error && tasks.length === 0 && (
        <MessageCard
          variant="neutral"
          message={t(
            "taskBankEmpty",
            {},
            {
              default: "No tasks or surveys to show here yet.",
            }
          )}
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
