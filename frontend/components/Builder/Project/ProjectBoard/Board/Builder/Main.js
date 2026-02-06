import { useState } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import ProposalHeader from "./Header";
import ProposalBoard from "./Board";
import ProposalCardWrapper from "../Card/Wrapper";

import { UPDATE_CARD_EDIT } from "../../../../../Mutations/Proposal";
import { PROPOSAL_QUERY } from "../../../../../Queries/Proposal";

export default function ProposalBuilder({
  user,
  proposal,
  onClose,
  proposalBuildMode,
  isPreview,
  refetchQueries,
  isPDF,
  setIsPDF,
  page: controlledPage,
  setPage: controlledSetPage,
  card: controlledCard,
  setCard: controlledSetCard,
}) {
  const { t } = useTranslation("builder");
  const [updateEdit, { loading: updateEditLoading }] = useMutation(
    UPDATE_CARD_EDIT,
    {
      refetchQueries: [
        { query: PROPOSAL_QUERY, variables: { id: proposal?.id } },
      ],
    }
  );

  const [internalPage, setInternalPage] = useState("board");
  const [internalCard, setInternalCard] = useState(null);

  const isControlled = controlledSetPage != null;
  const page = isControlled ? controlledPage : internalPage;
  const setPage = isControlled ? controlledSetPage : setInternalPage;
  const card = isControlled ? controlledCard : internalCard;
  const setCard = isControlled ? controlledSetCard : setInternalCard;

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
      {page === "board" ? (
        <>
          {isPreview ? (
            <>
              <h2>
                {t("proposal.previewHeader", "Preview of proposal template")}
                {" "}
                <span className="templateName">{proposal.title}</span>
              </h2>
              <p>{proposal.description}</p>
            </>
          ) : proposalBuildMode ? (
            <ProposalHeader
              user={user}
              proposal={proposal}
              proposalBuildMode={proposalBuildMode}
              refetchQueries={refetchQueries}
              isPDF={isPDF}
              setIsPDF={setIsPDF}
            />
          ) : null}
          {proposal && (
            <ProposalBoard
              proposalId={proposal?.id}
              openCard={openCard}
              isPreview={isPreview}
            />
          )}
        </>
      ) : (
        card && (
          <div
            className="hideScrollbar"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflowY: "auto",
            }}
          >
            <ProposalCardWrapper
              user={user}
              proposal={proposal}
              cardId={card?.id}
              closeCard={closeCard}
              proposalBuildMode={proposalBuildMode}
              isPreview={isPreview}
            />
          </div>
        )
      )}
    </>
  );
}
