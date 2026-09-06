import { useQuery, useMutation } from "@apollo/client";
import { useEffect, useMemo, useRef, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import {
  UPDATE_CARD_EDIT,
  UPDATE_PROJECT_BOARD,
} from "../../../../../../Mutations/Proposal";
import { PROPOSAL_QUERY } from "../../../../../../Queries/Proposal";
import { PROPOSAL_REVIEWS_QUERY } from "../../../../../../Queries/Proposal";
import { CREATE_LOG } from "../../../../../../Mutations/Log";
import {
  buildDualWriteUpdate,
  isMilestoneSubmitted,
  isOpenForComments,
  readMilestoneStatus,
} from "../../../../../../../lib/milestoneStatus";
import { useBoardMilestones } from "../../../../../../../lib/useBoardMilestones";
import {
  cardIncludedInReviewStep,
  milestoneHasReviewQuestionnaire,
  resolveMilestoneFromCard,
} from "../../../../../../../lib/milestones";

import Navigation from "./Navigation";
import { cardTypes } from "../../Builder/Actions/ActionCard";

import Button from "../../../../../../DesignSystem/Button";
import IconButton from "../../../../../../DesignSystem/IconButton";
import { CloseIcon } from "../../../../../../DesignSystem/Icons";
import Modal from "../../../../../../DesignSystem/Modal";
import FormDefinitionPreview from "../../../../../../Forms/DefinitionForm/FormDefinitionPreview";
import TipTapEditor from "../../../../../../TipTap/Main";
import { StyledActionPage } from "../../../../../../styles/StyledReview";
import Feedback from "../../../../../../Dashboard/Review/Feedback/Main";
import StatusChip from "../../PDF/Preview/StatusChip";

export default function Proposal({
  query,
  tab,
  user,
  proposalId,
  proposal,
  cardId,
  proposalCard,
}) {
  const { t } = useTranslation("builder");

  const { milestones } = useBoardMilestones(proposal?.id || proposalId);
  const milestone = resolveMilestoneFromCard(proposalCard, milestones);
  const reviewStepKey =
    milestone?.key ||
    milestone?.actionCardType ||
    proposalCard?.type;
  const reviewStage =
    milestone?.reviewStage || cardTypes[proposalCard?.type]?.reviewStage;
  const previewTitle =
    milestone?.title || cardTypes[proposalCard?.type]?.previewTitle;
  const submitName = milestone?.title?.toLowerCase() || proposalCard?.type;

  // Filter cards to show only those that are included in this specific review step
  // Cards must have this action card type in their includeInReviewSteps array
  // The includeInReport flag is for the final project report, not for intermediate review steps
  const cards =
    proposal?.sections
      ?.slice()
      ?.sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0))
      ?.flatMap((section) =>
        section?.cards
          ?.filter((card) =>
            cardIncludedInReviewStep(card, reviewStepKey, milestones)
          )
          ?.sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0)) || []
      ) || [];

  const [editedCards, setEditedCards] = useState({});
  const [saveErrors, setSaveErrors] = useState({});
  const [formPreviewOpen, setFormPreviewOpen] = useState(false);
  const pendingEntryByCardRef = useRef({});
  const saveChainByCardRef = useRef({});
  const handleSaveCardRef = useRef(async () => {});
  const inFlightSavesRef = useRef(new Set());

  const collaborationUser = useMemo(
    () => ({
      id: user?.id || null,
      name:
        user?.username ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        "Editor",
    }),
    [user?.firstName, user?.id, user?.lastName, user?.username]
  );

  const statusesDict = {
    Completed: "completed",
    "In progress": "inProgress",
    "Help needed": "helpNeeded",
    Comments: "comments",
    "Not started": "notStarted",
  };

  const allCardsCompleted =
    cards?.filter((card) => card?.settings?.status !== "Completed").length ===
    0;
  const isProposalSubmitted = isMilestoneSubmitted(
    proposal,
    milestone,
    milestones
  );
  const isFeedbackLocked = !isOpenForComments(proposal, milestone, milestones);

  const { data } = useQuery(PROPOSAL_REVIEWS_QUERY, {
    variables: {
      id: proposal?.id,
    },
  });

  const project = data?.proposalBoard || { sections: [] };

  const [updateProposal, { loading }] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: [
      {
        query: PROPOSAL_QUERY,
        variables: { id: proposal?.id },
      },
    ],
  });

  const [createLog] = useMutation(CREATE_LOG);
  const [updateCardContent] = useMutation(UPDATE_CARD_EDIT);

  const flushPendingCardSaves = async () => {
    cards.forEach((card) => {
      if (card?.id && pendingEntryByCardRef.current[card.id]) {
        ensureCardSaveChain(card);
      }
    });
    await Promise.all(
      Object.values(saveChainByCardRef.current).filter(Boolean)
    );
    if (inFlightSavesRef.current.size > 0) {
      await Promise.all(Array.from(inFlightSavesRef.current));
    }
  };

  const ensureCardSaveChain = (card) => {
    if (!card?.id) return null;
    const cardId = card.id;
    if (saveChainByCardRef.current[cardId]) {
      return saveChainByCardRef.current[cardId];
    }

    const chain = (async () => {
      while (pendingEntryByCardRef.current[cardId]) {
        const entry = pendingEntryByCardRef.current[cardId];
        delete pendingEntryByCardRef.current[cardId];
        if (!entry?.dirty) continue;
        await handleSaveCardRef.current(card, entry);
      }
    })().finally(() => {
      saveChainByCardRef.current[cardId] = null;
    });

    saveChainByCardRef.current[cardId] = chain;
    return chain;
  };

  const queueCardContentSave = (card, entry) => {
    if (!card?.id || !entry?.dirty) return;
    pendingEntryByCardRef.current[card.id] = entry;
    ensureCardSaveChain(card);
  };

  const submitProposal = async () => {
    await flushPendingCardSaves();

    const snapshotCards = cards.map((card) => {
      const entry = editedCards[card?.id];
      if (!entry) return card;
      return {
        ...card,
        content: entry.content ?? card.content,
        settings: entry.status
          ? { ...(card.settings || {}), status: entry.status }
          : card.settings,
      };
    });

    const updateInput = buildDualWriteUpdate(
      milestone,
      {
        status: "SUBMITTED",
        openForComments: true,
        openForParticipation: proposalCard?.type === "ACTION_COLLECTING_DATA",
      },
      proposal?.milestoneStatus
    );

    const res = await updateProposal({
      variables: {
        id: proposal?.id,
        input: updateInput,
      },
    });
    await createLog({
      variables: {
        input: {
          event: milestone?.logEventName || "PROPOSAL_SUBMITTED_FOR_REVIEW",
          user: {
            connect: { id: user?.id },
          },
          proposal: {
            connect: { id: proposalId },
          },
          class: {
            connect: { id: proposal?.usedInClass?.id },
          },
          content: {
            proposalSnapshot: snapshotCards,
          },
        },
      },
    });
    if (res?.data?.updateProposalBoard?.id) {
      alert(t("proposalAction.submittedForReview", "The proposal was submitted for review"));
    }
  };

  const switchFeedbackLock = async () => {
    // Preserve the current milestone status — this toggle only changes the
    // comment lock. Hardcoding "SUBMITTED" here would stomp a review-cycle
    // state like REVISION_REQUESTED back to SUBMITTED on every lock/unlock.
    const currentEntry = readMilestoneStatus(
      proposal,
      milestone?.key,
      milestones
    );
    const updateInput = buildDualWriteUpdate(
      milestone,
      {
        status: currentEntry?.status || "SUBMITTED",
        openForComments: isFeedbackLocked,
      },
      proposal?.milestoneStatus
    );

    const res = await updateProposal({
      variables: {
        id: proposal?.id,
        input: updateInput,
      },
    });
    if (res?.data?.updateProposalBoard?.id) {
      if (isFeedbackLocked) {
        alert(t("proposalAction.unlockedForFeedback", "The proposal was unlocked for feedback"));
      } else {
        alert(t("proposalAction.lockedForFeedback", "The proposal was locked for feedback"));
      }
    }
  };

  useEffect(() => {
    if (!cards?.length) return;

    setEditedCards((prev) => {
      let hasChanges = false;
      const next = { ...prev };

      cards.forEach((card) => {
        if (!card?.id) return;
        const serverContent = card?.content || "";
        const serverStatus = card?.settings?.status || "Not started";
        const existing = next[card.id];
        if (!existing) {
          next[card.id] = {
            content: serverContent,
            contentBaseline: serverContent,
            status: serverStatus,
            statusBaseline: serverStatus,
            dirty: false,
          };
          hasChanges = true;
          return;
        }

        if (!existing.dirty) {
          const needsReset =
            existing.content !== serverContent ||
            existing.contentBaseline !== serverContent ||
            existing.status !== serverStatus ||
            existing.statusBaseline !== serverStatus;

          if (needsReset) {
            next[card.id] = {
              content: serverContent,
              contentBaseline: serverContent,
              status: serverStatus,
              statusBaseline: serverStatus,
              dirty: false,
            };
            hasChanges = true;
          }
        } else {
          let entryChanged = false;
          const updatedEntry = { ...existing };

          if (existing.contentBaseline !== serverContent) {
            updatedEntry.contentBaseline = serverContent;
            entryChanged = true;
          }

          if (existing.statusBaseline !== serverStatus) {
            updatedEntry.statusBaseline = serverStatus;
            entryChanged = true;
          }

          if (entryChanged) {
            next[card.id] = updatedEntry;
            hasChanges = true;
          }
        }
      });

      const nextCardIds = new Set(
        cards.map((card) => card?.id).filter((id) => Boolean(id))
      );

      Object.keys(next).forEach((cardId) => {
        if (!nextCardIds.has(cardId)) {
          delete next[cardId];
          hasChanges = true;
        }
      });

      return hasChanges ? next : prev;
    });
  }, [cards]);

  const handleCardContentChange = (card, newContent) => {
    if (!card?.id) return;
    const normalizedContent = newContent || "";
    let nextEntry = null;

    setEditedCards((prev) => {
      const defaultContent = card?.content || "";
      const defaultStatus = card?.settings?.status || "Not started";
      const currentEntry =
        prev[card.id] || {
          content: defaultContent,
          contentBaseline: defaultContent,
          status: defaultStatus,
          statusBaseline: defaultStatus,
          dirty: false,
        };

      const contentBaseline =
        currentEntry.contentBaseline !== undefined
          ? currentEntry.contentBaseline
          : defaultContent;
      const statusBaseline =
        currentEntry.statusBaseline !== undefined
          ? currentEntry.statusBaseline
          : defaultStatus;

      const currentStatus =
        currentEntry.status !== undefined
          ? currentEntry.status
          : defaultStatus;

      const isDirty =
        normalizedContent !== contentBaseline ||
        currentStatus !== statusBaseline;

      nextEntry = {
        ...currentEntry,
        content: normalizedContent,
        contentBaseline,
        status: currentStatus,
        statusBaseline,
        dirty: isDirty,
      };

      return {
        ...prev,
        [card.id]: nextEntry,
      };
    });

    if (nextEntry?.dirty) {
      queueCardContentSave(card, nextEntry);
    }

    setSaveErrors((prev) => {
      if (!prev[card.id]) return prev;
      const { [card.id]: _discard, ...rest } = prev;
      return rest;
    });
  };

  const handleStatusChange = (card, newStatus) => {
    if (!card?.id) return;

    const normalizedStatus = newStatus || "Not started";

    let updatedEntryRef = null;

    setEditedCards((prev) => {
      const defaultContent = card?.content || "";
      const defaultStatus = card?.settings?.status || "Not started";
      const currentEntry =
        prev[card.id] || {
          content: defaultContent,
          contentBaseline: defaultContent,
          status: defaultStatus,
          statusBaseline: defaultStatus,
          dirty: false,
        };

      const contentBaseline =
        currentEntry.contentBaseline !== undefined
          ? currentEntry.contentBaseline
          : defaultContent;
      const statusBaseline =
        currentEntry.statusBaseline !== undefined
          ? currentEntry.statusBaseline
          : defaultStatus;

      const contentValue =
        currentEntry.content !== undefined
          ? currentEntry.content
          : defaultContent;

      const isDirty =
        contentValue !== contentBaseline ||
        normalizedStatus !== statusBaseline;

      const nextEntry = {
        ...currentEntry,
        content: contentValue,
        contentBaseline,
        status: normalizedStatus,
        statusBaseline,
        dirty: isDirty,
      };

      updatedEntryRef = nextEntry;

      return {
        ...prev,
        [card.id]: nextEntry,
      };
    });

    setSaveErrors((prev) => {
      if (!prev[card.id]) return prev;
      const { [card.id]: _discard, ...rest } = prev;
      return rest;
    });

    if (updatedEntryRef?.dirty) {
      handleSaveCard(card, updatedEntryRef);
    }
  };

  const handleSaveCard = async (card, overrideEntry = null) => {
    if (!card?.id) return;
    const defaultContent = card?.content || "";
    const defaultStatus = card?.settings?.status || "Not started";

    const entry =
      overrideEntry ||
      editedCards[card.id] || {
        content: defaultContent,
        contentBaseline: defaultContent,
        status: defaultStatus,
        statusBaseline: defaultStatus,
        dirty: false,
      };
    if (!entry || !entry.dirty) return;

    const contentBaseline =
      entry.contentBaseline !== undefined ? entry.contentBaseline : defaultContent;
    const statusBaseline =
      entry.statusBaseline !== undefined ? entry.statusBaseline : defaultStatus;

    const contentToSave =
      entry.content !== undefined ? entry.content : defaultContent;
    const statusToSave =
      entry.status !== undefined ? entry.status : defaultStatus;

    const shouldSaveContent = contentToSave !== contentBaseline;
    const shouldSaveStatus = statusToSave !== statusBaseline;

    const input = {};
    if (shouldSaveContent) {
      input.content = contentToSave;
    }
    if (shouldSaveStatus) {
      input.settings = {
        ...(card?.settings || {}),
        status: statusToSave,
      };
    }

    if (!shouldSaveContent && !shouldSaveStatus) {
      setEditedCards((prev) => ({
        ...prev,
        [card.id]: {
          ...prev[card.id],
          content: contentToSave,
          contentBaseline: contentToSave,
          status: statusToSave,
          statusBaseline: statusToSave,
          dirty: false,
        },
      }));
      return;
    }

    const isContentOnlySave = shouldSaveContent && !shouldSaveStatus;

    setSaveErrors((prev) => {
      if (!prev[card.id]) return prev;
      const { [card.id]: _discard, ...rest } = prev;
      return rest;
    });

    const savePromise = (async () => {
      try {
        await updateCardContent({
          variables: {
            id: card.id,
            input,
          },
          ...(isContentOnlySave
            ? {}
            : {
                refetchQueries: [
                  {
                    query: PROPOSAL_QUERY,
                    variables: { id: proposal?.id },
                  },
                ],
                awaitRefetchQueries: true,
              }),
        });

        setEditedCards((prev) => {
          const current = prev[card.id] || {};
          const nextContentBaseline =
            current.content === contentToSave
              ? contentToSave
              : current.contentBaseline;
          const nextStatusBaseline =
            current.status === statusToSave
              ? statusToSave
              : current.statusBaseline;
          const resolvedContent = current.content ?? contentToSave;
          const resolvedStatus = current.status ?? statusToSave;

          return {
            ...prev,
            [card.id]: {
              ...current,
              content: resolvedContent,
              status: resolvedStatus,
              contentBaseline: nextContentBaseline,
              statusBaseline: nextStatusBaseline,
              dirty:
                resolvedContent !== nextContentBaseline ||
                resolvedStatus !== nextStatusBaseline,
            },
          };
        });
      } catch (error) {
        console.error("Failed to save proposal card content", error);
        const fallbackMessage = t(
          "proposalAction.saveError",
          "Unable to save changes. Please try again."
        );
        setSaveErrors((prev) => ({
          ...prev,
          [card.id]: error?.message || fallbackMessage,
        }));
      }
    })();

    inFlightSavesRef.current.add(savePromise);
    try {
      await savePromise;
    } finally {
      inFlightSavesRef.current.delete(savePromise);
    }
  };

  handleSaveCardRef.current = handleSaveCard;

  const canEditCards = !isProposalSubmitted;
  const hasReviewQuestionnaire = milestoneHasReviewQuestionnaire(milestone);

  return (
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        proposalId={proposalId}
        cardId={cardId}
        saveBtnName={t("proposalAction.submitFor", { title: cardTypes[proposalCard?.type]?.title || previewTitle }, `Submit for ${cardTypes[proposalCard?.type]?.title || previewTitle}`)}
        saveBtnFunction={() => {
          submitProposal();
        }}
        allCardsCompleted={allCardsCompleted}
        isProposalSubmitted={isProposalSubmitted}
        switchFeedbackLock={switchFeedbackLock}
        isFeedbackLocked={isFeedbackLocked}
      />
      <StyledActionPage>
        <div className="board">
          <div className="proposal">
            <div className="iconTitle">
              <img src="/assets/icons/project.svg" />
              <div className="title MH-Type-Title-Base">{previewTitle}</div>
            </div>

            <div className="subtitle MH-Type-Body-Base">
              {t("proposalAction.feedbackCenterPreview", "This is how your proposal will appear in the Feedback Center")}
            </div>
            <div className="cards">
              {cards?.map((card) => (
                <div className="card" key={card?.id || card?.title}>
                  <div
                    className="cardTitleIcon"
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gridColumn: "auto",
                      flexWrap: "nowrap",
                      width: "100%",
                    }}
                  >
                    <div className="cardTitle">
                      <a
                        href={
                          (() => {
                            // Get current URL as object
                            const url = new URL(window.location.href);
                            // Update or add the 'card' search param
                            if (card?.id) {
                              url.searchParams.set("card", card.id);
                            }
                            return url.pathname + url.search + url.hash;
                          })()
                        }
                      >
                        {card?.title}
                      </a>
                    </div>
                    {canEditCards ? (
                      <div
                        className="cardStatusDropdown"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        <StatusChip
                          value={
                            editedCards[card?.id]?.status ??
                            card?.settings?.status
                          }
                          onStatusChange={(value) =>
                            handleStatusChange(card, value)
                          }
                          canEdit
                        />
                      </div>
                    ) : (
                      <img
                        src={`/assets/icons/status/${
                          statusesDict[
                            (
                              card?.settings?.status ??
                              "Not started"
                            ) || "Not started"
                          ] || "notStarted"
                        }.svg`}
                        alt={t(
                          "proposalAction.currentStatus",
                          "Current card status"
                        )}
                        style={{ display: "block" }}
                      />
                    )}
                  </div>
                  <TipTapEditor
                    content={
                      card?.id && editedCards[card.id]
                        ? editedCards[card.id].content
                        : card?.content || ""
                    }
                    collaboration={
                      card?.id
                        ? {
                            documentName: `proposalCard:${card.id}`,
                            field: "content",
                          }
                        : null
                    }
                    collaborationUser={collaborationUser}
                    onUpdate={(newContent) =>
                      handleCardContentChange(card, newContent)
                    }
                    isEditable={canEditCards}
                    toolbarVisible={canEditCards}
                    mediaLibraryId={proposalId}
                    mediaLibrarySource={{
                      sourceType: "projectCard",
                      sourceId: card?.id ?? null,
                      createdWith: "upload",
                    }}
                    mediaDisplayedInProposalCardId={card?.id ?? null}
                  />
                  {canEditCards && saveErrors[card?.id] && (
                    <div
                      className="cardSaveError MH-Type-Body-Base"
                      style={{
                        marginTop: "0.5rem",
                        color: "#b30000",
                      }}
                    >
                      {saveErrors[card?.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="instructions">
            {isProposalSubmitted ? (
              <>
                <div className="iconTitle">
                  <img src="/assets/icons/eye.svg" />
                  <div className="title MH-Type-Title-Base">{t("proposalAction.comments", "Comments")}</div>
                </div>

                <div className="reviews">
                  <Feedback
                    user={user}
                    projectId={project?.id}
                    status={reviewStage}
                    reviews={
                      project?.reviews?.filter(
                        (review) => review.stage === reviewStage
                      ) || []
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div className="title MH-Type-Title-Base">
                  {t("proposalAction.submitForTitle", {
                    name: submitName,
                  }, `Submit your proposal for ${submitName}`)}
                </div>

                <div className="subtitle MH-Type-Body-Base">
                  {t("proposalAction.submitForFeedbackIntro", "Once you submit your proposal for feedback:")}
                  <ul>
                    <li>{t("proposalAction.appearInFeedbackCenter", "Your proposal will appear in the Feedback Center.")}</li>
                    {milestone?.description && (
                      <li>{milestone.description}</li>
                    )}
                    <li>{t("proposalAction.cardsLocked", "The cards that are included in the Proposal will be locked. Your teacher can unlock them.")}</li>
                  </ul>
                </div>

                {/* {hasReviewQuestionnaire ? (
                  <Button
                    type="button"
                    variant="filled"
                    onClick={() => setFormPreviewOpen(true)}
                  >
                    {t(
                      "proposalAction.viewAttachedFeedbackForm",
                      {},
                      {
                        default:
                          "View feedback form attached to this milestone.",
                      }
                    )}
                  </Button>
                ) : null} */}

                <div className="subtitle MH-Type-Body-Base">
                  {t("proposalAction.completeAllBeforeSubmit", "Please make sure all cards listed below are marked as “completed” before you submit.")}
                </div>

                <div className="lists">
                  {cards?.map((card) => (
                    <div className="list">
                      <div className="listIconTitle">
                        <img
                          src={`/assets/icons/status/${
                            statusesDict[card?.settings?.status] || "notStarted"
                          }.svg`}
                        />
                        <div>
                          <div className="listTitle MH-Type-Label-Large">{card?.title}</div>
                          <div className="listSubtitle MH-Type-Label-Large">
                            {card?.settings?.status || t("proposalAction.notStarted", "Not started")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {allCardsCompleted ? (
                  <div className="subtitle MH-Type-Body-Base">
                    {t("proposalAction.readyToSubmit", "The proposal is ready to be submitted for feedback!")}
                  </div>
                ) : (
                  <div className="subtitle warning MH-Type-Body-Base">
                    {t("proposalAction.completeAllRequired", "Please complete all required cards before submitting your proposal for feedback.")}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </StyledActionPage>

      <Modal
        open={formPreviewOpen}
        onClose={() => setFormPreviewOpen(false)}
        size="large"
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              width: "100%",
            }}
          >
            <span>
              {t(
                "proposalAction.feedbackFormModalTitle",
                {},
                { default: "Feedback form attached to this milestone" }
              )}
            </span>
            <IconButton
              type="button"
              variant="subtle"
              icon={<CloseIcon />}
              ariaLabel={t(
                "proposalAction.feedbackFormModalClose",
                {},
                { default: "Close" }
              )}
              onClick={() => setFormPreviewOpen(false)}
            />
          </div>
        }
      >
        {formPreviewOpen ? (
          <FormDefinitionPreview
            board={proposal}
            milestone={milestone}
            proposalBoardId={proposal?.id}
            maxHeight="none"
          />
        ) : null}
      </Modal>
    </>
  );
}
