import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import DevelopProjectBank from "../../Projects/Bank/Develop";
import DevelopStudyBank from "../../Studies/Bank/Develop";
import DevelopTaskBank from "../../Tasks/Bank/Develop";

export default function Panels({ query, user }) {
  const { t } = useTranslation("builder");
  const { selector } = query;

  const userPermissions = user.permissions.map(
    (permission) => permission?.name
  );

  // choose default selector for user dependent on user permissions
  const selectorForUser = userPermissions.includes("SCIENTIST")
    ? selector || "studies"
    : selector || "projects";

  return (
    <>
      <div className="menu">
        <Link href="/dashboard/develop/projects">
          <div
            className={
              selectorForUser === "projects"
                ? "menuTitle selectedMenuTitle"
                : "menuTitle"
            }
          >
            <p>{t("myProjects")}</p>
          </div>
        </Link>

        <Link href="/dashboard/develop/studies">
          <div
            className={
              selectorForUser === "studies"
                ? "menuTitle selectedMenuTitle"
                : "menuTitle"
            }
          >
            <p>{t("myStudies")}</p>
          </div>
        </Link>

        <Link href="/dashboard/develop/tasks">
          <div
            className={
              selectorForUser === "tasks"
                ? "menuTitle selectedMenuTitle"
                : "menuTitle"
            }
          >
            <p>{t("myTasks")}</p>
          </div>
        </Link>

        <Link href="/dashboard/develop/surveys">
          <div
            className={
              selectorForUser === "surveys"
                ? "menuTitle selectedMenuTitle"
                : "menuTitle"
            }
          >
            <p>{t("mySurveys")}</p>
          </div>
        </Link>

        <Link href="/dashboard/develop/blocks">
          <div
            className={
              selectorForUser === "blocks"
                ? "menuTitle selectedMenuTitle"
                : "menuTitle"
            }
          >
            <p>{t("myBlocks")}</p>
          </div>
        </Link>
      </div>

      {selectorForUser == "projects" && <DevelopProjectBank user={user} />}

      {selectorForUser == "studies" && <DevelopStudyBank user={user} />}

      {selectorForUser == "tasks" && (
        <DevelopTaskBank user={user} taskType="TASK" />
      )}

      {selectorForUser == "surveys" && (
        <DevelopTaskBank user={user} taskType="SURVEY" />
      )}

      {selectorForUser == "blocks" && (
        <DevelopTaskBank user={user} taskType="BLOCK" />
      )}
    </>
  );
}
