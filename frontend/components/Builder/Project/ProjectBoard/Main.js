import { useQuery } from "@apollo/client";
import { Sidebar } from "semantic-ui-react";
import { useEffect } from 'react';

import CardWrapper from "./Board/Card/Wrapper";
import Navigation from "../Navigation/Main";
import ProposalPage from "./ProposalPage";

import { PROPOSAL_QUERY } from "../../../Queries/Proposal";

import { StyledProposal } from "../../../styles/StyledProposal";

export default function ProjectBoard({ query, user, tab, toggleSidebar }) {
  const proposalId = query?.selector;
  const cardId = query?.card;

  const { data, error, loading } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
  });

  const proposal = data?.proposalBoard || { sections: [] };

  useEffect(() => {
    function handleStartTour() {
      (async () => {
        const introJs = (await import('intro.js')).default;
        introJs.tour().setOptions({
          steps: [
            {
              element: '#menue',
              intro: "Use this menu to switch between different components of your project.",
              position: "bottom",
              disableInteraction: false
            },
            {
              element: '#switchMode',
              intro: "Use this toggle to switch between edit (columns and cards) and preview mode (long format; you can still edit the content there).<br><br>This is also the place for you to download your proposal as a PDF.",
              position: "bottom",
              disableInteraction: false
            },
            {
              element: '#section',
              intro: "Columns are there to help you organize your project proposal. Each column contains cards with individual statuses that you can click into. ",
              position: "bottom",
              disableInteraction: false
            },
            {
              element: '#card',
              intro: "Each card contains instruction on how to complete your proposal. You can click on the card to view the instructions and change its status.",
              position: "bottom",
              disableInteraction: false
            },
            {
              element: '#cardWithTag',
              intro: "Cards with this tag will see their content sent to review in the Feedback Center once you have submitted them.<br><br>Each cards contains tags that indicate a which stage of the feedbach process its content should be added to.<br><br>Yellow tags indicate that the card has not been submitted yet, while blue tags indicate that the card has been submitted.",
              position: "bottom",
              disableInteraction: false
            },
            {
              element: '#submitCard',
                intro: "This button lets you submit the cards that are associated with each review stage in the Feedback Center.",
                position: "bottom",
                disableInteraction: false
              },
            {
              element: '#connectArea',
              intro: "Click here to add collaborators to your project and connect it to a class.",
              position: "bottom",
              disableInteraction: false
            },
          ],
          scrollToElement: false,
          scrollTo: 'off',
        }).start();
      })();
    }
    window.addEventListener('start-walkthrough-tour', handleStartTour);
    return () => window.removeEventListener('start-walkthrough-tour', handleStartTour);
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
