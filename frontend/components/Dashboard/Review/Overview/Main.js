import Link from "next/link";

// get all proposals of the featured studies, and all proposals of the studies in the class network
import { useQuery } from "@apollo/client";
import { GET_USER_CLASSES } from "../../../Queries/User";
import { useEffect, useMemo } from 'react';

import ProjectsBoard from "./Projects/Main";
import StudiesBoard from "./Studies/Main";
import { NavbarItem, SectionNavbar } from "../../../DesignSystem/Navbar";
import useTranslation from "next-translate/useTranslation";
import { reviewOverviewTours } from "./tours";
import { buildFeedbackCenterTabs } from "../../../../lib/feedbackCenterTabs";
import { GET_MILESTONES } from "../../../Queries/Milestone";
import { CLASS_TEMPLATE_PROJECTS_FOR_CLASSES_QUERY } from "../../../Queries/Proposal";
import { getFeedbackCenterMilestones } from "../../../../lib/milestones";
import { unionMilestonesFromTemplateBoards } from "../../../../lib/templateBoardActionCards";

export default function Overview({ query, user }) {
  const { t } = useTranslation("builder");
  const { data: milestonesData } = useQuery(GET_MILESTONES);
  const globalMilestones = milestonesData?.milestones || [];

  // get all classes of a particular user (including classes from the class network)
  const { data: classesData } = useQuery(GET_USER_CLASSES);
  const us = classesData?.authenticatedItem || {
    studentIn: [],
    teacherIn: [],
    mentorIn: [],
  };
  const teacherMentorClassIds = useMemo(() => {
    const profile = classesData?.authenticatedItem;
    const ids = [...(profile?.teacherIn || []), ...(profile?.mentorIn || [])]
      .map((theclass) => theclass?.id)
      .filter(Boolean);
    return [...new Set(ids)];
  }, [classesData]);

  const { data: templateBoardsData, loading: templateBoardsLoading } = useQuery(
    CLASS_TEMPLATE_PROJECTS_FOR_CLASSES_QUERY,
    {
      variables: { classIds: teacherMentorClassIds },
      skip: teacherMentorClassIds.length === 0,
    }
  );
  const accessibleTemplateBoards = templateBoardsData?.proposalBoards || [];

  const classTemplateSteps = useMemo(
    () =>
      getFeedbackCenterMilestones(
        unionMilestonesFromTemplateBoards(
          accessibleTemplateBoards,
          globalMilestones
        )
      ),
    [accessibleTemplateBoards, globalMilestones]
  );
  const feedbackTabs = buildFeedbackCenterTabs(classTemplateSteps, t);

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

  const selector = query?.selector;
  const isCollectingData = selector === "collectingdata";
  const matchedTab = feedbackTabs.find(
    (tab) => tab.selector === selector || tab.milestoneKey === selector
  );
  const activeSelector = isCollectingData
    ? "collectingdata"
    : matchedTab?.selector || (!selector ? feedbackTabs[0]?.selector : selector);

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
      <header className="overviewHeader">
        <h1 className="MH-Type-Heading-Base">{t("review.feedbackCenter")}</h1>
        <p>{t("review.overviewIntro")}</p>
      </header>

      <SectionNavbar
        variant="underline"
        showRule
        id="options"
        aria-label={t("review.feedbackCenter")}
      >
        {!templateBoardsLoading &&
          feedbackTabs.map((tab) => (
            <NavbarItem
              key={tab.selector}
              as={Link}
              href={`/dashboard/review/${tab.selector}`}
              id={tab.selector === "proposals" ? "proposal" : tab.selector}
              selected={
                activeSelector === tab.selector ||
                (!selector && tab.selector === feedbackTabs[0]?.selector)
              }
            >
              {tab.label || t(tab.labelKey, {}, { default: tab.milestoneKey })}
            </NavbarItem>
          ))}

        {/* collectingdata tab is study-based, not milestone-driven */}
        <NavbarItem
          as={Link}
          href="/dashboard/review/collectingdata"
          id="collectData"
          selected={selector === "collectingdata"}
        >
          {t("review.collectingDataMenu")}
        </NavbarItem>
      </SectionNavbar>

      {!isCollectingData && activeSelector ? (
        <ProjectsBoard
          selector={activeSelector}
          allUniqueClassIds={allUniqueClassIds}
          myClassesIds={myClasses.map((cl) => cl?.id)}
          allUniqueClasses={allUniqueClasses}
          milestones={
            classTemplateSteps.length ? classTemplateSteps : globalMilestones
          }
        />
      ) : null}

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