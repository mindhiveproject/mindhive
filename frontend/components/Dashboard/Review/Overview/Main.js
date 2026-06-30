import Link from "next/link";

// get all proposals of the featured studies, and all proposals of the studies in the class network
import { useQuery } from "@apollo/client";
import { GET_USER_CLASSES } from "../../../Queries/User";
import { useEffect } from 'react';

import ProjectsBoard from "./Projects/Main";
import StudiesBoard from "./Studies/Main";
import useTranslation from "next-translate/useTranslation";
import { reviewOverviewTours } from "./tours";
import { FEEDBACK_CENTER_TABS, buildFeedbackCenterTabs } from "../../../../lib/feedbackCenterTabs";
import { GET_MILESTONES } from "../../../Queries/Milestone";

export default function Overview({ query, user }) {
  const { t } = useTranslation("builder");
  const { data: milestonesData } = useQuery(GET_MILESTONES);
  const globalMilestones = milestonesData?.milestones || [];
  const feedbackTabs = buildFeedbackCenterTabs(globalMilestones, t);
  const legacySelectors = FEEDBACK_CENTER_TABS.map((tab) => tab.selector);

  useEffect(() => {
    let currentTour = null;
    let isStartingTour = false;
    
    function handleStartTour(event) {
      const tourId = event?.detail?.tourId || 'overview';
      const tourData = event?.detail?.tourData;
      
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
        
        // Use tour data from event if available, otherwise fallback to static import
        let selectedTour = tourData;
        if (!selectedTour) {
          const tours = reviewOverviewTours;
          selectedTour = tours[tourId];
        }
        
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
    <div className="overview" id="overview">
      <div className="h40">{t("review.feedbackCenter")}</div>
      <div className="h24">{t("review.overviewIntro")}</div>

      <div id="options" className="menu">
        {feedbackTabs.map((tab) => (
          <Link
            key={tab.selector}
            href={`/dashboard/review/${tab.selector}`}
            id={tab.selector === "proposals" ? "proposal" : tab.selector}
          >
            <div
              className={
                selector === tab.selector ||
                (!selector && tab.selector === "proposals")
                  ? "menuTitle selectedMenuTitle"
                  : "menuTitle"
              }
            >
              <p>{tab.label || t(tab.labelKey, {}, { default: tab.milestoneKey })}</p>
            </div>
          </Link>
        ))}

        <Link href="/dashboard/review/collectingdata" id="collectData">
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

        {/* collectingdata tab is study-based, not milestone-driven */}
      </div>

      {(!selector ||
        legacySelectors.includes(selector) ||
        feedbackTabs.some((tab) => tab.selector === selector)) && (
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