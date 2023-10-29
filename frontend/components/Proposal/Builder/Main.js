import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";

import ProposalHeader from "./Header";
import ProposalBoard from "./Board";
import ProposalCard from "../Card/Main";

import { PROPOSAL_QUERY } from "../../Queries/Proposal";
import { UPDATE_CARD_EDIT } from "../../Mutations/Proposal";

import { Menu, Sidebar } from "semantic-ui-react";

export default function ProposalBuilder({
  user,
  proposalId,
  onClose,
  proposalBuildMode,
  isPreview,
  refetchQueries,
}) {
  const { loading, error, data } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
    pollInterval: 20000, // get new data every 20 seconds
  });

  const [updateEdit, { loading: updateEditLoading }] =
    useMutation(UPDATE_CARD_EDIT);

  const proposal = data?.proposalBoard || undefined;

  const [page, setPage] = useState("board");
  const [card, setCard] = useState(null);

  const openCard = (card) => {
    setCard(card);
    setPage("card");
  };

  const closeCard = async ({ cardId, lockedByUser }) => {
    console.log({ cardId, lockedByUser });
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

  if (loading) return "Loading...";
  if (error) return `Error! ${error.message}`;

  return (
    <>
      <Sidebar
        as={Menu}
        animation="overlay"
        icon="labeled"
        // onHide={() => {
        //   console.log({ card });
        //   closeCard({
        //     cardId: card?.id,
        //     lockedByUser: card?.isEditedBy?.username === user?.username,
        //   });
        // }}
        vertical
        visible={page === "card"}
        direction="right"
      >
        {card && (
          <ProposalCard
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
        {proposalBuildMode && (
          <div className="goBackBtn">
            <span style={{ cursor: "pointer" }} onClick={onClose}>
              ← Back
            </span>
          </div>
        )}
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
            proposal={proposal}
            openCard={openCard}
            isPreview={isPreview}
          />
        )}
      </Sidebar.Pusher>
    </>
  );
}
