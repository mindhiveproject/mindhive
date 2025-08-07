import { useQuery } from "@apollo/client";
import { useEffect } from "react";

import Navigation from "../Navigation/Main";
import Proposal from "./Proposal";

import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";

import { StyledReviewPage } from "../../../styles/StyledReview";
import { reviewTours } from "./tour";

export default function Review({ query, user, tab, toggleSidebar }) {
  const projectId = query?.selector;

  const { data, loading, error } = useQuery(PROPOSAL_REVIEWS_QUERY, {
    variables: {
      id: projectId,
    },
  });

  const project = data?.proposalBoard || {};

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
          const tours = reviewTours;
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

  return (
    <>
      <Navigation proposalId={projectId} query={query} user={user} tab={tab} />
      <StyledReviewPage>
        <Proposal query={query} user={user} project={project} />
      </StyledReviewPage>
    </>
  );
}

Review.hasTour = true;
Review.tours = reviewTours;