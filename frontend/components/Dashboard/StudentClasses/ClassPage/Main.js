import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import Link from "next/link";

import Header from "./Header";
import ClassAssignments from "./Assignments/Main";
import ClassStudents from "./Students";
import ClassStudies from "./Studies";

import { GET_CLASS } from "../../../Queries/Classes";

export default function ClassPage({ code, user, query }) {
  const { t } = useTranslation("classes");
  const page = query?.page || "assignments";

  const { data, loading, error } = useQuery(GET_CLASS, {
    variables: { code },
  });

  const myclass = data?.class || { title: "", description: "" };

  return (
    <div>
      <Header user={user} myclass={myclass} />
      <div>
        <div className="menu">
          <Link
            href={{
              pathname: `/dashboard/classes/${code}`,
              query: {
                page: "assignments",
              },
            }}
            className={
              page === "assignments"
                ? "menuTitle selectedMenuTitle"
                : "menuTitle"
            }
          >
            <p>{t("assignmentsTab")}</p>
          </Link>
          <Link
            href={{
              pathname: `/dashboard/classes/${code}`,
              query: {
                page: "students",
              },
            }}
            className={
              page === "students" ? "menuTitle selectedMenuTitle" : "menuTitle"
            }
          >
            <p>{t("studentsTab")}</p>
          </Link>

          <Link
            href={{
              pathname: `/dashboard/classes/${code}`,
              query: {
                page: "studies",
              },
            }}
            className={
              page === "studies" ? "menuTitle selectedMenuTitle" : "menuTitle"
            }
          >
            <p>{t("studiesTab")}</p>
          </Link>
        </div>
      </div>

      <div>
        {page === "assignments" && (
          <ClassAssignments myclass={myclass} user={user} query={query} />
        )}
      </div>

      <div>
        {page === "students" && (
          <ClassStudents myclass={myclass} user={user} query={query} />
        )}
      </div>

      <div>
        {page === "studies" && (
          <ClassStudies myclass={myclass} user={user} query={query} />
        )}
      </div>
    </div>
  );
}
