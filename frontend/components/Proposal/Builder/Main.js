import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import ProposalHeader from "./Header";
import ProposalBoard from "./Board";
import ProposalCardWrapper from "../Card/Wrapper";

import { UPDATE_CARD_EDIT, APPLY_TEMPLATE_BOARD_CHANGES } from "../../Mutations/Proposal";
import { PROPOSAL_QUERY, OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../Queries/Proposal";

const TEMPLATE_AUTO_UPDATE_KEY = "proposalTemplateAutoUpdate";

export default function ProposalBuilder({
  user,
  proposal,
  onClose,
  proposalBuildMode,
  isPreview,
  refetchQueries,
}) {
  const { t } = useTranslation("builder");
  const [autoUpdateStudentBoards, setAutoUpdateStudentBoards] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !proposal?.id) return;
    try {
      const stored = window.localStorage.getItem(
        `${TEMPLATE_AUTO_UPDATE_KEY}_${proposal.id}`
      );
      setAutoUpdateStudentBoards(stored === "true");
    } catch (_) {}
  }, [proposal?.id]);

  const handleAutoUpdateChange = useCallback(
    (checked) => {
      setAutoUpdateStudentBoards(checked);
      if (typeof window !== "undefined" && proposal?.id) {
        try {
          window.localStorage.setItem(
            `${TEMPLATE_AUTO_UPDATE_KEY}_${proposal.id}`,
            String(checked)
          );
        } catch (_) {}
      }
    },
    [proposal?.id]
  );

  const [applyTemplateChanges] = useMutation(APPLY_TEMPLATE_BOARD_CHANGES, {
    refetchQueries: [
      { query: OVERVIEW_PROPOSAL_BOARD_QUERY, variables: { id: proposal?.id } },
      { query: PROPOSAL_QUERY, variables: { id: proposal?.id } },
      ...(refetchQueries || []),
    ],
  });

  const propagateToClones = useCallback(async (options) => {
    if (!proposal?.id) return null;
    const res = await applyTemplateChanges({
      variables: {
        templateBoardId: proposal.id,
        cardIdsWithContentUpdate: options?.contentChangedCardIds ?? null,
      },
    });
    return res?.data?.applyTemplateBoardChanges ?? null;
  }, [proposal?.id, applyTemplateChanges]);

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
              height: "100%",
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
              autoUpdateStudentBoards={autoUpdateStudentBoards}
              propagateToClones={propagateToClones}
            />
          </div>
        )
      )}
    </>
  );
}
