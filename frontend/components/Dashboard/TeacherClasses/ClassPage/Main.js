import { useQuery } from "@apollo/client";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { Menu } from "semantic-ui-react";
import Link from "next/link";

import Header from "./Header";
import ClassStudents from "./Students";
import ClassMentors from "./Mentors";
import ClassStudies from "./Studies";
import ClassAssignments from "./Assignments/Main";
import ClassSettings from "./Settings";

import { GET_CLASS } from "../../../Queries/Classes";
import RestrictedAccess from "../../../Global/Restricted";

export default function ClassPage({ code, user, query }) {
  const { t } = useTranslation("classes");
  const page = query?.page || "students";

  const { data, loading, error } = useQuery(GET_CLASS, {
    variables: { code },
  });

  const myclass = data?.class || { title: "", description: "" };

  return (
    <RestrictedAccess
      userCanAccess={[
        ...user?.teacherIn.map((c) => c?.id),
        ...user?.mentorIn.map((c) => c?.id),
      ]}
      whatToAccess={myclass?.id}
    >
      <div>
        <Header user={user} myclass={myclass} />
        <div className="upperMenu">
          <div className="menu">
            <Link
              href={{
                pathname: `/dashboard/myclasses/${code}`,
                query: {
                  page: "students",
                },
              }}
              className={
                page === "students"
                  ? "menuTitle selectedMenuTitle"
                  : "menuTitle"
              }
            >
              <p>Students</p>
            </Link>

            <Link
              href={{
                pathname: `/dashboard/myclasses/${code}`,
                query: {
                  page: "mentors",
                },
              }}
              className={
                page === "mentors" ? "menuTitle selectedMenuTitle" : "menuTitle"
              }
            >
              <p>Mentors</p>
            </Link>

            <Link
              href={{
                pathname: `/dashboard/myclasses/${code}`,
                query: {
                  page: "studies",
                },
              }}
              className={
                page === "studies" ? "menuTitle selectedMenuTitle" : "menuTitle"
              }
            >
              <p>Studies</p>
            </Link>

            <Link
              href={{
                pathname: `/dashboard/myclasses/${code}`,
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
              <p>Assignments</p>
            </Link>

            <Link
              href={{
                pathname: `/dashboard/myclasses/${code}`,
                query: {
                  page: "settings",
                },
              }}
              className={
                page === "settings"
                  ? "menuTitle selectedMenuTitle"
                  : "menuTitle"
              }
            >
              <p>Settings</p>
            </Link>
          </div>
        </div>

        <div>
          {page === "students" && (
            <ClassStudents myclass={myclass} user={user} query={query} />
          )}
        </div>
        <div>
          {page === "mentors" && (
            <ClassMentors myclass={myclass} user={user} query={query} />
          )}
        </div>
        <div>
          {page === "studies" && (
            <ClassStudies myclass={myclass} user={user} query={query} />
          )}
        </div>
        <div>
          {page === "assignments" && (
            <ClassAssignments myclass={myclass} user={user} query={query} />
          )}
        </div>
        <div>
          {page === "settings" && (
            <ClassSettings myclass={myclass} user={user} query={query} />
          )}
        </div>
      </div>
    </RestrictedAccess>
  );
}
