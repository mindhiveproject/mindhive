import Link from "next/link";

// get all proposals of the featured studies, and all proposals of the studies in the class network
import { useQuery } from "@apollo/client";
import { GET_USER_CLASSES } from "../../../Queries/User";

import StudiesBoard from "./Studies/Main";
import ProjectsBoard from "./Projects/Main";

export default function Overview({ query, user }) {
  const selector = query?.selector || "proposals";

  // get all classes of a particular user (including classes from the class network)
  const { data: classesData } = useQuery(GET_USER_CLASSES);
  const us = classesData?.authenticatedItem || {
    studentIn: [],
    teacherIn: [],
    mentorIn: [],
  };
  const myClasses = [...us?.studentIn, ...us?.teacherIn, ...us?.mentorIn] || [];

  const networkClasses =
    myClasses
      .map((myClass) => {
        if (myClass?.networks) {
          return myClass?.networks?.map((net) => net.classes).flat();
        }
        return [];
      })
      .flat() || [];
  const allClasses = [...myClasses, ...networkClasses];
  const allClassIds = allClasses.map((theclass) => theclass.id);
  const allUniqueClassIds = [...new Set([...allClassIds])];

  return (
    <div className="overview">
      <div className="h40">Feedback Center</div>
      <div className="h24">
        Whether you're starting your study or collecting participants, use this
        page to give feedback to your fellow peers on their proposals and
        finalized studies
      </div>

      <div className="menu">
        <Link href="/dashboard/review/proposals">
          <div
            className={
              selector === "proposals" || !selector
                ? "menuTitle selectedMenuTitle"
                : "menuTitle"
            }
          >
            <p>Proposals</p>
          </div>
        </Link>

        <Link href="/dashboard/review/inreview">
          <div
            className={
              selector === "inreview"
                ? "menuTitle selectedMenuTitle"
                : "menuTitle"
            }
          >
            <p>In review</p>
          </div>
        </Link>

        <Link href="/dashboard/review/collectingdata">
          <div
            className={
              selector === "collectingdata"
                ? "menuTitle selectedMenuTitle"
                : "menuTitle"
            }
          >
            <p>Collecting data</p>
          </div>
        </Link>

        <Link href="/dashboard/review/report">
          <div
            className={
              selector === "report"
                ? "menuTitle selectedMenuTitle"
                : "menuTitle"
            }
          >
            <p>Project report</p>
          </div>
        </Link>
      </div>

      {(!selector ||
        selector === "proposals" ||
        selector === "inreview" ||
        selector === "report") && (
        <ProjectsBoard
          selector={selector}
          allUniqueClassIds={allUniqueClassIds}
          myClassesIds={myClasses.map((cl) => cl?.id)}
        />
      )}

      {selector === "collectingdata" && (
        <StudiesBoard
          selector={selector}
          allUniqueClassIds={allUniqueClassIds}
          myClassesIds={myClasses.map((cl) => cl?.id)}
        />
      )}
    </div>
  );
}
