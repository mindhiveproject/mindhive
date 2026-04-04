import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import { v1 as uuidv1 } from "uuid";

import ProposalHeader from "./Header";
import ProposalBoard from "./Board";
import ProposalCardWrapper from "../Card/Wrapper";
import useTemplatePropagation from "./useTemplatePropagation";

import { UPDATE_CARD_EDIT } from "../../Mutations/Proposal";
import { PROPOSAL_QUERY } from "../../Queries/Proposal";
import { isClassTemplateBoard } from "../../Utils/proposalBoard";

export default function ProposalBuilder({
  user,
  proposal,
  onClose,
  proposalBuildMode,
  isPreview,
  refetchQueries,
}) {
  const { t } = useTranslation("builder");
  const {
    autoUpdateStudentBoards,
    handleAutoUpdateChange,
    hasUnpropagatedChanges,
    markUnpropagatedChange,
    clearUnpropagatedChange,
    propagateToClones,
    propagateLoading,
  } = useTemplatePropagation({
    proposalId: proposal?.id,
    refetchQueries,
  });

  const [updateEdit, { loading: updateEditLoading }] = useMutation(
    UPDATE_CARD_EDIT,
    {
      refetchQueries: [
        { query: PROPOSAL_QUERY, variables: { id: proposal?.id } },
      ],
    }
  );

  const backfillPublicIdDoneRef = useRef(null);

  useEffect(() => {
    if (!proposal?.id || !Array.isArray(proposal?.sections)) {
      return;
    }

    if (!isClassTemplateBoard(proposal)) return;
    if (backfillPublicIdDoneRef.current === proposal.id) return;

    const sections = proposal.sections || [];
    const cardsWithoutPublicId = sections
      .flatMap((section) => section?.cards || [])
      .filter((card) => card && !card.publicId);

    if (cardsWithoutPublicId.length === 0) {
      backfillPublicIdDoneRef.current = proposal.id;
      return;
    }

    cardsWithoutPublicId.forEach((card) => {
      updateEdit({
        variables: {
          id: card.id,
          input: {
            publicId: uuidv1(),
          },
        },
      }).catch((e) => {
        // eslint-disable-next-line no-console
        console.error("Failed to backfill card publicId in ProposalBuilder:", e);
      });
    });

    backfillPublicIdDoneRef.current = proposal.id;
  }, [proposal, updateEdit]);

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
      {page === "board" ? (
        <>
          {isPreview ? (
            <>
              <h2>
                {t("proposal.previewHeader", "Preview of proposal template")}{" "}
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
              autoUpdateStudentBoards={autoUpdateStudentBoards}
              onAutoUpdateChange={handleAutoUpdateChange}
              propagateToClones={propagateToClones}
              hasUnpropagatedChanges={hasUnpropagatedChanges}
              onPropagationSuccess={clearUnpropagatedChange}
              isPropagatingToClones={propagateLoading}
            />
          )}
          {proposal && (
            <ProposalBoard
              proposalId={proposal?.id}
              openCard={openCard}
              isPreview={isPreview}
              proposalBuildMode={proposalBuildMode}
              autoUpdateStudentBoards={autoUpdateStudentBoards}
              propagateToClones={propagateToClones}
              onTemplateChangedWithoutPropagation={markUnpropagatedChange}
            />
          )}
        </>
      ) : (
        card && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            <ProposalCardWrapper
              user={user}
              proposal={proposal}
              cardId={card?.id}
              closeCard={closeCard}
              proposalBuildMode={proposalBuildMode}
              isPreview={isPreview}
              autoUpdateStudentBoards={autoUpdateStudentBoards}
              propagateToClones={propagateToClones}
              onTemplateChangedWithoutPropagation={markUnpropagatedChange}
            />
          </div>
        )
      )}
    </>
  );
}
