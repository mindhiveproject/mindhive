import Link from "next/link";

// get all proposals of the featured studies, and all proposals of the studies in the class network
import { useQuery } from "@apollo/client";
import { GET_USER_CLASSES } from "../../../Queries/User";
import { useEffect } from 'react';

import ProjectsBoard from "./Projects/Main";
import StudiesBoard from "./Studies/Main";
import useTranslation from "next-translate/useTranslation";

export default function Overview({ query, user }) {
  const { t } = useTranslation("builder");

  useEffect(() => {
    function handleStartTour() {
      (async () => {
        const introJs = (await import('intro.js')).default;
        introJs.tour().setOptions({
          steps: [
            {
              element: '#options',
              intro: "Click here to start developing a new study, task, survey, or block.",
              position: "bottom",
              disableInteraction: false
            },
            {
              element: '#searchArea',
              intro: "Search by name",
              position: "auto",
              disableInteraction: false,
            },
            {
              element: '#sortBy',
              intro: "Sort by time or number of comments posted",
              position: "auto",
              disableInteraction: false,
            },
            {
              element: '#filterByClasses',
              intro: "Filter to only see projects in a specific class",
              position: "auto",
              disableInteraction: false,
            }
          ],
          scrollToElement: false,
          scrollTo: 'off',
        }).start();
      })();
    }
    window.addEventListener('start-walkthrough-tour', handleStartTour);
    return () => window.removeEventListener('start-walkthrough-tour', handleStartTour);
  }, []);

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
  const allUniqueClasses = allUniqueClassIds.map((id) => {
    return {
      id,
      title: allClasses.find((cl) => cl?.id === id).title,
    };
  });

  return (
    <div className="overview">
      <div className="h40">{t("review.feedbackCenter")}</div>
      <div className="h24">{t("review.overviewIntro")}</div>

      <div id="options" className="menu">
        <Link href="/dashboard/review/proposals">
          <div
            className={
              selector === "proposals" || !selector
                ? "menuTitle selectedMenuTitle"
                : "menuTitle"
            }
          >
            <p>{t("review.proposals")}</p>
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
            <p>{t("review.inReview")}</p>
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
            <p>{t("review.collectingDataMenu")}</p>
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
            <p>{t("review.projectReport")}</p>
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
          allUniqueClasses={allUniqueClasses}
        />
      )}

      {selector === "collectingdata" && (
        <StudiesBoard
          selector={selector}
          allUniqueClassIds={allUniqueClassIds}
          myClassesIds={myClasses.map((cl) => cl?.id)}
          allUniqueClasses={allUniqueClasses}
        />
      )}
    </div>
  );
}

// Indicate this page has a tour
Overview.hasTour = true;