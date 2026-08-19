import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import { v1 as uuidv1 } from "uuid";

import BoardEditorChrome from "./BoardEditorChrome";
import ProposalBoard from "./Board";
import ProposalCardWrapper from "../Card/Wrapper";
import useTemplatePropagation from "./useTemplatePropagation";

import { UPDATE_CARD_EDIT } from "../../Mutations/Proposal";
import { PROPOSAL_QUERY } from "../../Queries/Proposal";
import { isClassTemplateBoard } from "../../Utils/proposalBoard";
import { isActionCard } from "../../../lib/milestones";
import { getActionCardLabel } from "../../../lib/templateBoardActionCards";

export default function ProposalBuilder({
  user,
  proposal,
  onClose,
  proposalBuildMode,
  isPreview,
  hidePreviewHeader = false,
  refetchQueries,
  autoOpenAddMilestone = false,
}) {
  const { t } = useTranslation("builder");
  const {
    autoUpdateStudentBoards,
    handleAutoUpdateChange,
    markUnpropagatedChange,
    clearUnpropagatedChange,
    propagateToClones,
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
  const cardCloseHandlerRef = useRef(null);

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

  const openCard = (nextCard) => {
    setCard(nextCard);
    setPage("card");
  };

  const closeCard = async ({ cardId, lockedByUser }) => {
    if (cardId && lockedByUser) {
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
    cardCloseHandlerRef.current = null;
    setPage("board");
    setCard(null);
  };

  const registerCloseHandler = useCallback((handler) => {
    cardCloseHandlerRef.current = handler;
  }, []);

  const handleChromeBack = async () => {
    if (page === "card") {
      if (cardCloseHandlerRef.current) {
        await cardCloseHandlerRef.current();
        return;
      }
      await closeCard({ cardId: card?.id, lockedByUser: false });
      return;
    }
    onClose?.();
  };

  const cardTitle = card
    ? isActionCard(card)
      ? getActionCardLabel(card, t)
      : card?.title
    : "";
  const hideBoardChromeNav = !isPreview && !!proposalBuildMode;
  const showChrome = !isPreview;

  return (
    <>
      {showChrome ? (
        <BoardEditorChrome
          user={user}
          proposal={proposal}
          proposalBuildMode={proposalBuildMode}
          refetchQueries={refetchQueries}
          mode={page === "card" ? "card" : "board"}
          cardTitle={cardTitle}
          onBack={onClose || page === "card" ? handleChromeBack : undefined}
          autoUpdateStudentBoards={autoUpdateStudentBoards}
          onAutoUpdateChange={handleAutoUpdateChange}
          propagateToClones={propagateToClones}
          onPropagationSuccess={clearUnpropagatedChange}
        />
      ) : null}
      {page === "board" ? (
        <>
          {isPreview && !hidePreviewHeader ? (
            <>
              <h2>
                {t(
                  "proposal.previewHeader",
                  {},
                  { default: "Preview of proposal template" }
                )}{" "}
                <span className="templateName">{proposal.title}</span>
              </h2>
              {proposal.description ? <p>{proposal.description}</p> : null}
            </>
          ) : null}
          {proposal && (
            <ProposalBoard
              proposalId={proposal?.id}
              openCard={openCard}
              isPreview={isPreview}
              proposalBuildMode={proposalBuildMode}
              autoUpdateStudentBoards={autoUpdateStudentBoards}
              propagateToClones={propagateToClones}
              onTemplateChangedWithoutPropagation={markUnpropagatedChange}
              autoOpenAddMilestone={autoOpenAddMilestone}
            />
          )}
        </>
      ) : (
        card && (
          <div
            className="boardEditorBody"
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
              hideBoardChromeNav={hideBoardChromeNav}
              registerCloseHandler={registerCloseHandler}
            />
          </div>
        )
      )}
    </>
  );
}
