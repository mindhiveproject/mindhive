import Link from "next/link";

import DevelopProjectBank from "../../Projects/Bank/Develop";
import DevelopStudyBank from "../../Studies/Bank/Develop";
import DevelopTaskBank from "../../Tasks/Bank/Develop";

export default function Panels({ query, user }) {
  const { selector } = query;
  return (
    <>
      <div className="menu">
        <Link href="/dashboard/develop/studies">
          <div
            className={
              selector === "studies" || !selector
                ? "menuTitle selectedMenuTitle"
                : "menuTitle"
            }
          >
            <p>My studies</p>
          </div>
        </Link>

        {user?.permissions?.map((p) => p?.name).includes("ADMIN") && (
          <Link href="/dashboard/develop/projects">
            <div
              className={
                selector === "projects"
                  ? "menuTitle selectedMenuTitle"
                  : "menuTitle"
              }
            >
              <p>My projects</p>
            </div>
          </Link>
        )}

        <Link href="/dashboard/develop/tasks">
          <div
            className={
              selector === "tasks" ? "menuTitle selectedMenuTitle" : "menuTitle"
            }
          >
            <p>My tasks</p>
          </div>
        </Link>

        <Link href="/dashboard/develop/surveys">
          <div
            className={
              selector === "surveys"
                ? "menuTitle selectedMenuTitle"
                : "menuTitle"
            }
          >
            <p>My surveys</p>
          </div>
        </Link>

        <Link href="/dashboard/develop/blocks">
          <div
            className={
              selector === "blocks"
                ? "menuTitle selectedMenuTitle"
                : "menuTitle"
            }
          >
            <p>My blocks</p>
          </div>
        </Link>
      </div>

      {selector == "projects" && <DevelopProjectBank user={user} />}

      {(!selector || selector == "studies") && <DevelopStudyBank user={user} />}

      {selector == "tasks" && <DevelopTaskBank user={user} taskType="TASK" />}

      {selector == "surveys" && (
        <DevelopTaskBank user={user} taskType="SURVEY" />
      )}

      {selector == "blocks" && <DevelopTaskBank user={user} taskType="BLOCK" />}
    </>
  );
}
