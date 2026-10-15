import { useState, useCallback, useRef } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import BoardEditorChrome from "./BoardEditorChrome";
import ProposalBoard from "./Board";
import StudentBoard from "../../Builder/Project/ProjectBoard/Board/Builder/Board";
import ProposalCardWrapper from "../Card/Wrapper";
import useTemplatePropagation from "./useTemplatePropagation";

import { UPDATE_CARD_EDIT } from "../../Mutations/Proposal";
import { PROPOSAL_QUERY } from "../../Queries/Proposal";
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
  boardSettings = null,
  openSettingsOnMount = false,
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

  const cardCloseHandlerRef = useRef(null);
  const cardChromeHandlersRef = useRef({});
  const [cardChrome, setCardChrome] = useState(null);

  const [page, setPage] = useState("board");
  const [card, setCard] = useState(null);
  // Board shown as students see it; cards opened from it start in preview
  // and closing them returns here.
  const [boardPreview, setBoardPreview] = useState(false);

  const openCard = (nextCard) => {
    setCard(nextCard);
    setPage("card");
  };

  const openCardFromBoardPreview = (nextCard) =>
    openCard({ ...nextCard, openInPreview: true });

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
    cardChromeHandlersRef.current = {};
    setCardChrome(null);
    setPage("board");
    setCard(null);
  };

  const registerCloseHandler = useCallback((handler) => {
    cardCloseHandlerRef.current = handler;
  }, []);

  const registerCardChrome = useCallback((config) => {
    if (!config) {
      cardChromeHandlersRef.current = {};
      setCardChrome(null);
      return;
    }
    cardChromeHandlersRef.current = {
      onSave: config.onSave,
      onPreview: config.onPreview,
      onExitPreview: config.onExitPreview,
    };
    setCardChrome((prev) => {
      const next = {
        kind: config.kind,
        canPreview: typeof config.onPreview === "function",
        previewDisabled: !!config.previewDisabled,
        previewMode: !!config.previewMode,
        saving: !!config.saving,
        saveDisabled: !!config.saveDisabled,
        typeLabel: config.typeLabel || null,
        isDefaultAction: !!config.isDefaultAction,
        saveLabel: config.saveLabel || null,
      };
      if (
        prev &&
        prev.kind === next.kind &&
        prev.canPreview === next.canPreview &&
        prev.previewDisabled === next.previewDisabled &&
        prev.previewMode === next.previewMode &&
        prev.saving === next.saving &&
        prev.saveDisabled === next.saveDisabled &&
        prev.typeLabel === next.typeLabel &&
        prev.isDefaultAction === next.isDefaultAction &&
        prev.saveLabel === next.saveLabel
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const handleCardSave = useCallback(
    () => cardChromeHandlersRef.current.onSave?.(),
    []
  );
  const handleCardPreview = useCallback(
    () => cardChromeHandlersRef.current.onPreview?.(),
    []
  );
  const handleCardExitPreview = useCallback(
    () => cardChromeHandlersRef.current.onExitPreview?.(),
    []
  );

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

  const isCreateMilestone = !!card?.createMilestone;
  const isCreateProposalCard = !!card?.createProposalCard;
  const cardTitle = isCreateMilestone
    ? t(
        "section.createMilestone.title",
        {},
        { default: "New milestone" }
      )
    : isCreateProposalCard
      ? t("section.createProposalCard.title", {}, { default: "New card" })
      : card
        ? isActionCard(card)
          ? getActionCardLabel(card, t)
          : card?.title
        : "";
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
          cardChrome={page === "card" ? cardChrome : null}
          onCardSave={handleCardSave}
          onCardPreview={handleCardPreview}
          onCardExitPreview={handleCardExitPreview}
          boardPreviewMode={boardPreview}
          onBoardPreview={
            proposalBuildMode ? () => setBoardPreview(true) : undefined
          }
          onExitBoardPreview={() => setBoardPreview(false)}
          boardSettings={boardSettings}
          openSettingsOnMount={openSettingsOnMount}
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
          {proposal && boardPreview ? (
            <div className="boardPreview">
              <StudentBoard
                proposalId={proposal?.id}
                openCard={openCardFromBoardPreview}
                proposalBuildMode={false}
                isPreview
              />
            </div>
          ) : proposal ? (
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
          ) : null}
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
              initialFormEditor={card?.openFormEditor || null}
              startInPreview={!!card?.openInPreview}
              isCreateMilestone={isCreateMilestone}
              isCreateProposalCard={isCreateProposalCard}
              sectionId={card?.sectionId || null}
              openCard={openCard}
              closeCard={closeCard}
              proposalBuildMode={proposalBuildMode}
              isPreview={isPreview}
              autoUpdateStudentBoards={autoUpdateStudentBoards}
              propagateToClones={propagateToClones}
              onTemplateChangedWithoutPropagation={markUnpropagatedChange}
              registerCloseHandler={registerCloseHandler}
              registerCardChrome={registerCardChrome}
            />
          </div>
        )
      )}
    </>
  );
}
