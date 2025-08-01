import { useQuery } from "@apollo/client";
import { Sidebar } from "semantic-ui-react";
import { useEffect } from 'react';

import CardWrapper from "./Board/Card/Wrapper";
import Navigation from "../Navigation/Main";
import ProposalPage from "./ProposalPage";

import { PROPOSAL_QUERY } from "../../../Queries/Proposal";
import { projectBoardTours } from "./tours";

import { StyledProposal } from "../../../styles/StyledProposal";

export default function ProjectBoard({ query, user, tab, toggleSidebar }) {
  const proposalId = query?.selector;
  const cardId = query?.card;

  const { data, error, loading } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
  });

  const proposal = data?.proposalBoard || { sections: [] };

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
        const tours = projectBoardTours;
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
          showStepNumbers: false,
          showBullets: true,
          showProgress: false,
        });
        
        // Start the tour
        currentTour.start();
        
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

  if (cardId) {
    return (
      <CardWrapper
        query={query}
        tab={tab}
        user={user}
        proposalId={proposalId}
        proposal={proposal}
        cardId={cardId}
        closeCard={() => {}}
        proposalBuildMode={false}
        isPreview={false}
      />
    );
  }

  return (
    <Sidebar.Pushable>
      {proposalId && (
        <>
          <Navigation
            proposalId={proposalId}
            query={query}
            user={user}
            tab={tab}
            toggleSidebar={toggleSidebar}
          />
          <StyledProposal>
            <ProposalPage user={user} proposalId={proposalId} />
          </StyledProposal>
        </>
      )}
    </Sidebar.Pushable>
  );
}

// Indicate this page has a tour
ProjectBoard.hasTour = true;
