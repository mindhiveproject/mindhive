import Link from "next/link";

// get all proposals of the featured studies, and all proposals of the studies in the class network
import { useQuery } from "@apollo/client";
import { GET_USER_CLASSES } from "../../../Queries/User";
import { useEffect } from 'react';

import ProjectsBoard from "./Projects/Main";
import StudiesBoard from "./Studies/Main";
import useTranslation from "next-translate/useTranslation";
import { reviewOverviewTours } from "./tours";

export default function Overview({ query, user }) {
  const { t } = useTranslation("builder");

  useEffect(() => {
    let currentTour = null;
    let isStartingTour = false;
    
    function handleStartTour(event) {
      const tourId = event?.detail?.tourId || 'overview';
      
      // Prevent multiple tours from starting simultaneously
      if (isStartingTour) {
        console.log('Tour already starting, ignoring request');
        return;
      }
      
      isStartingTour = true;
      
      // Exit any existing tour first
      if (currentTour) {
        currentTour.exit();
        currentTour = null;
      }
      
      (async () => {
        const introJs = (await import('intro.js')).default;
        const tours = reviewOverviewTours;
        const selectedTour = tours[tourId];
        
        if (!selectedTour) {
          console.error(`Tour ${tourId} not found`);
          isStartingTour = false;
          return;
        }

        // Create new tour instance
        currentTour = introJs.tour();
        currentTour.setOptions({
          steps: selectedTour.steps,
          scrollToElement: false,
          scrollTo: 'off',
          exitOnOverlayClick: true,
          exitOnEsc: true,
          showBullets: true,
        });
        
        // Start the tour
        currentTour.start();
        
        // Clean up when tour ends
        currentTour.onComplete(() => {
          currentTour = null;
          isStartingTour = false;
        });
        
        currentTour.onExit(() => {
          currentTour = null;
          isStartingTour = false;
        });
      })();
    }
    
    // Remove any existing listeners first
    window.removeEventListener('start-walkthrough-tour', handleStartTour);
    window.addEventListener('start-walkthrough-tour', handleStartTour);
    
    return () => {
      window.removeEventListener('start-walkthrough-tour', handleStartTour);
      // Clean up any existing tour when component unmounts
      if (currentTour) {
        currentTour.exit();
      }
    };
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
        <Link href="/dashboard/review/proposals" id="proposal">
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

        <Link href="/dashboard/review/inreview" id="peerReview">
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

        <Link href="/dashboard/review/collectingdata"  id="collectData">
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

        <Link href="/dashboard/review/report" id="report">
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