import { useQuery } from "@apollo/client";
import { useEffect } from "react";
import { GET_PROJECT_STUDY_ID } from "../../../Queries/Proposal";
import { visualizeTours } from "./tours";

import Visualize from "./Main";

export default function ProjectWrapper({ query, user, tab, toggleSidebar }) {
  const projectId = query?.selector;

  if (!projectId) {
    return <div>No project found, please save your project first.</div>;
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
          const tours = visualizeTours;
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading project data</div>;

  return (
    <Visualize
      query={query}
      user={user}
      tab={tab}
      toggleSidebar={toggleSidebar}
      projectId={projectId}
      studyId={studyId}
    />
  );
}
