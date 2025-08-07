import { useQuery } from "@apollo/client";
import { useEffect } from "react";
import { GET_PROJECT_STUDY_ID } from "../../../Queries/Proposal";
import useTranslation from "next-translate/useTranslation";

import Collect from "./Main";
import Navigation from "../Navigation/Main";
import InDev from "../../../Global/InDev";
import { collectTours } from "./tour";

export default function ProjectWrapper({ query, user, tab, toggleSidebar }) {
  const { t } = useTranslation("builder");
  const projectId = query?.selector;

  if (!projectId) {
    return <div>{t("collect.noProjectFound", "No project found, please save your project first.")}</div>;
  }

  const { data, error, loading } = useQuery(GET_PROJECT_STUDY_ID, {
    variables: { id: projectId },
  });

  const studyId = data?.proposalBoard?.study?.id;

  // Tour setup
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
        const tours = collectTours;
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
          scrollToElement: true,
          scrollTo: 'on',
          exitOnOverlayClick: true,
          exitOnEsc: true,
          showStepNumbers: false,
          showBullets: true,
          showProgress: false,
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

  if (studyId) {
    return (
      <Collect
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
        studyId={studyId}
      />
    );
  } else {
    return (
      <>
        <Navigation
          proposalId={query?.selector}
          query={query}
          user={user}
          tab={tab}
          toggleSidebar={toggleSidebar}
        />
        <InDev
          header={t("collect.noStudyAttachedHeader", "🤷🏻 Your project has no Study attached to it.")}
          message={t(
            "collect.noStudyAttachedMessage",
            "Let your teacher know so they can create one and associate it. If you need help, please contact tech support at support.mindhive@nyu.edu."
          )}
        />
      </>
    );
  }
}

ProjectWrapper.hasTour = true;
ProjectWrapper.tours = collectTours;