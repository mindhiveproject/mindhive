import { useState } from "react";
import { useMutation } from "@apollo/client";

import ProposalHeader from "./Header";
import ProposalBoard from "./Board";
import ProposalCardWrapper from "../Card/Wrapper";

import { UPDATE_CARD_EDIT } from "../../Mutations/Proposal";
import { PROPOSAL_QUERY } from "../../Queries/Proposal";

import { Menu, Sidebar } from "semantic-ui-react";

export default function ProposalBuilder({
  user,
  proposal,
  onClose,
  proposalBuildMode,
  isPreview,
  refetchQueries,
}) {
  const [updateEdit, { loading: updateEditLoading }] = useMutation(
    UPDATE_CARD_EDIT,
    {
      refetchQueries: [
        { query: PROPOSAL_QUERY, variables: { id: proposal?.id } },
      ],
    }
  );

  const [page, setPage] = useState("board");
  const [card, setCard] = useState(null);

  const openCard = (card) => {
    setCard(card);
    setPage("card");
  };

  const closeCard = async ({ cardId, lockedByUser }) => {
    if (cardId && lockedByUser) {
      // unlock the card
      await updateEdit({
        variables: {
          id: cardId,
          input: {
            isEditedBy: { disconnect: true },
            lastTimeEdited: null,
          },
        },
      });
    }
    setPage("board");
    setCard(null);
  };

  return (
    <>
      <Sidebar
        as={Menu}
        animation="overlay"
        icon="labeled"
        vertical
        visible={page === "card"}
        direction="right"
      >
        {card && (
          <ProposalCardWrapper
            user={user}
            proposal={proposal}
            cardId={card?.id}
            closeCard={closeCard}
            proposalBuildMode={proposalBuildMode}
            isPreview={isPreview}
          />
        )}
      </Sidebar>

      <Sidebar.Pusher>
        {isPreview ? (
          <>
            <h2>
              Preview of proposal template{" "}
              <span className="templateName">{proposal.title}</span>
            </h2>
            <p>{proposal.description}</p>
          </>
        ) : (
          <ProposalHeader
            user={user}
            proposal={proposal}
            proposalBuildMode={proposalBuildMode}
            refetchQueries={refetchQueries}
          />
        )}
        {proposal && (
          <ProposalBoard
            proposalId={proposal?.id}
            openCard={openCard}
            isPreview={isPreview}
          />
        )}
      </Sidebar.Pusher>
    </>
  );
}
