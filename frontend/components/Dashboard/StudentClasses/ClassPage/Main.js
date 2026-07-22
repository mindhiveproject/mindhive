import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import Link from "next/link";

import Header from "./Header";
import ClassAssignments from "./Assignments/Main";
import ClassStudies from "./Studies";
import ClassProjects from "./Projects";

import { GET_CLASS } from "../../../Queries/Classes";

const CLASS_PAGE_NAV_ITEMS = [
  {
    value: "assignments",
    labelKey: "main.assignments",
    defaultLabel: "Assignments",
  },
  {
    value: "studies",
    labelKey: "main.studies",
    defaultLabel: "Studies",
  },
  {
    value: "projects",
    labelKey: "main.projects",
    defaultLabel: "Projects",
  },
];

export default function ClassPage({ code, user, query }) {
  const { t } = useTranslation("classes");
  const page = query?.page || "assignments";

  const { data } = useQuery(GET_CLASS, {
    variables: { code },
  });

  const myclass = data?.class || { title: "", description: "" };

  return (
    <div>
      <Header myclass={myclass} />
      <nav
        className="classPageNav"
        aria-label={t("main.classSectionsNav", {}, {
          default: "Class sections",
        })}
      >
        <div className="secondLine">
          <div className="menu">
            {CLASS_PAGE_NAV_ITEMS.map((item) => (
              <Link
                key={item.value}
                href={{
                  pathname: `/dashboard/classes/${code}`,
                  query: { page: item.value },
                }}
                aria-current={page === item.value ? "page" : undefined}
              >
                <div
                  className={
                    page === item.value
                      ? "menuTitle selectedMenuTitle"
                      : "menuTitle"
                  }
                >
                  <div className="titleWithIcon">
                    <p>
                      {t(item.labelKey, {}, {
                        default: item.defaultLabel,
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div>
        {page === "assignments" && (
          <ClassAssignments myclass={myclass} user={user} query={query} />
        )}
      </div>

      <div>
        {page === "studies" && (
          <ClassStudies myclass={myclass} user={user} query={query} />
        )}
      </div>

      <div>
        {page === "projects" && (
          <ClassProjects myclass={myclass} user={user} query={query} />
        )}
      </div>
    </div>
  );
}
