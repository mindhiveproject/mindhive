import { useQuery, useMutation } from "@apollo/client";
import { useEffect, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import {
  UPDATE_CARD_EDIT,
  UPDATE_PROJECT_BOARD,
} from "../../../../../../Mutations/Proposal";
import { PROPOSAL_QUERY } from "../../../../../../Queries/Proposal";
import { PROPOSAL_REVIEWS_QUERY } from "../../../../../../Queries/Proposal";
import { CREATE_LOG } from "../../../../../../Mutations/Log";

import Navigation from "./Navigation";
import { cardTypes } from "../../Builder/Actions/ActionCard";

import TipTapEditor from "../../../../../../TipTap/Main";
import { StyledActionPage } from "../../../../../../styles/StyledReview";
import Feedback from "../../../../../../Dashboard/Review/Feedback/Main";
import Status from "../Forms/Status";

const submitOptions = {
  ACTION_SUBMIT: {
    event: "PROPOSAL_SUBMITTED_FOR_REVIEW",
    updateInput: {
      submitProposalStatus: "SUBMITTED",
      submitProposalOpenForComments: true,
    },
    name: "expert feedback",
    description:
      "Expert mentors will provide feedback & comments will appear here.",
    status: "SUBMITTED_AS_PROPOSAL",
  },
  ACTION_PEER_FEEDBACK: {
    event: "PROPOSAL_SUBMITTED_FOR_PEER_REVIEW",
    updateInput: {
      peerFeedbackStatus: "SUBMITTED",
      peerFeedbackOpenForComments: true,
    },
    name: "peer feedback",
    description:
      "Your peers will provide feedback & comments will appear here.",
    status: "PEER_REVIEW",
  },
  ACTION_COLLECTING_DATA: {
    event: "STUDY_SUBMITTED_FOR_DATA_COLLECTION",
    updateInput: {
      // should be updated in study
      dataCollectionStatus: "SUBMITTED",
      dataCollectionData: "REAL_DATA",
      dataCollectionOpenForParticipation: true,
    },
    name: "data collection",
    description: "",
    status: "DATA_COLLECTION",
  },
  ACTION_PROJECT_REPORT: {
    event: "PROJECT_SUBMITTED_FOR_REPORT",
    updateInput: {
      projectReportStatus: "SUBMITTED",
      projectReportOpenForComments: true,
    },
    name: "project report",
    description: "",
    status: "PROJECT_REPORT",
  },
};

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

  // find the current section for preview
  const currentSections = proposal?.sections?.filter((section) =>
    section?.cards.map((card) => card?.type).includes(proposalCard?.type)
  );

  const cards =
    proposal?.sections
      ?.slice()
      ?.sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0))
      ?.flatMap((section) =>
        section?.cards
          ?.filter(
            (card) =>
              (card?.settings?.includeInReport &&
                currentSections?.map((s) => s?.id).includes(card?.section?.id)) ||
              card?.settings?.includeInReviewSteps?.includes(proposalCard?.type)
          )
          ?.sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0)) || []
      ) || [];

  const [editedCards, setEditedCards] = useState({});
  const [saveStates, setSaveStates] = useState({});
  const [saveErrors, setSaveErrors] = useState({});

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
  const isProposalSubmitted =
    proposal[cardTypes[proposalCard?.type].proposalSubmitStatusQuery] ===
    "SUBMITTED";
  const isFeedbackLocked =
    !proposal[cardTypes[proposalCard?.type].proposalOpenForCommentsQuery];

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

  const submitProposal = async () => {
    const res = await updateProposal({
      variables: {
        id: proposal?.id,
        input: submitOptions[proposalCard.type]?.updateInput,
      },
    });
    await createLog({
      variables: {
        input: {
          event: submitOptions[proposalCard.type]?.event,
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
            proposalSnapshot: cards,
          },
        },
      },
    });
    if (res?.data?.updateProposalBoard?.id) {
      alert(t("proposalAction.submittedForReview", "The proposal was submitted for review"));
    }
  };

  const switchFeedbackLock = async () => {
    const res = await updateProposal({
      variables: {
        id: proposal?.id,
        input: {
          submitProposalOpenForComments: isFeedbackLocked,
        },
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

      return {
        ...prev,
        [card.id]: {
          ...currentEntry,
          content: normalizedContent,
          contentBaseline,
          status: currentStatus,
          statusBaseline,
          dirty: isDirty,
        },
      };
    });

    setSaveStates((prev) => {
      if (prev[card.id] && prev[card.id] !== "saving") {
        return { ...prev, [card.id]: "idle" };
      }
      return prev;
    });

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

    setSaveStates((prev) => {
      if (prev[card.id] && prev[card.id] !== "saving") {
        return { ...prev, [card.id]: "idle" };
      }
      return prev;
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

    setSaveStates((prev) => ({ ...prev, [card.id]: "saving" }));
    setSaveErrors((prev) => {
      if (!prev[card.id]) return prev;
      const { [card.id]: _discard, ...rest } = prev;
      return rest;
    });

    try {
      await updateCardContent({
        variables: {
          id: card.id,
          input,
        },
        refetchQueries: [
          {
            query: PROPOSAL_QUERY,
            variables: { id: proposal?.id },
          },
        ],
        awaitRefetchQueries: true,
      });

      setEditedCards((prev) => ({
        ...prev,
        [card.id]: {
          content: contentToSave,
          contentBaseline: contentToSave,
          status: statusToSave,
          statusBaseline: statusToSave,
          dirty: false,
        },
      }));

      setSaveStates((prev) => ({ ...prev, [card.id]: "success" }));

      setTimeout(() => {
        setSaveStates((prev) => {
          if (prev[card.id] !== "success") {
            return prev;
          }
          const { [card.id]: _discard, ...rest } = prev;
          return rest;
        });
      }, 2000);
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
      setSaveStates((prev) => ({ ...prev, [card.id]: "error" }));
    }
  };

  const canEditCards = !isProposalSubmitted;

  console.log(cards);
  return (
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        proposalId={proposalId}
        cardId={cardId}
        saveBtnName={t("proposalAction.submitFor", { title: cardTypes[proposalCard?.type].title }, `Submit for ${cardTypes[proposalCard?.type].title}`)}
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
              <div className="title">
                {cardTypes[proposalCard?.type].previewTitle}
              </div>
            </div>

            <div className="subtitle">
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
                          minWidth: "200px",
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        <Status
                          settings={{
                            status:
                              editedCards[card?.id]?.status ??
                              card?.settings?.status,
                          }}
                          onSettingsChange={(_, value) =>
                            handleStatusChange(card, value)
                          }
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
                    onUpdate={(newContent) =>
                      handleCardContentChange(card, newContent)
                    }
                    isEditable={canEditCards}
                    toolbarVisible={canEditCards}
                    specialButton={
                      canEditCards
                        ? {
                            label:
                              saveStates[card?.id] === "success"
                                ? t("proposalAction.saved", "Saved")
                                : saveStates[card?.id] === "error"
                                ? t("proposalAction.retrySave", "Retry save")
                                : t(
                                    "proposalAction.saveChangesButton",
                                    "Save changes"
                                  ),
                            icon:
                              saveStates[card?.id] === "success"
                                ? "check"
                                : undefined,
                            onClick: () => handleSaveCard(card),
                            disabled:
                              !(card?.id && editedCards[card.id]?.dirty) ||
                              saveStates[card?.id] === "saving",
                            loading: saveStates[card?.id] === "saving",
                            color:
                              saveStates[card?.id] === "success"
                                ? "#1C8F36"
                                : saveStates[card?.id] === "error"
                                ? "#B21E1E"
                                : "#274E5B",
                            colorBackground:
                              saveStates[card?.id] === "success"
                                ? "#E8F7EC"
                                : saveStates[card?.id] === "error"
                                ? "#FDEAEA"
                                : "#f0f5f5",
                          }
                        : null
                    }
                  />
                  {canEditCards && saveErrors[card?.id] && (
                    <div
                      className="cardSaveError"
                      style={{
                        marginTop: "0.5rem",
                        color: "#b30000",
                        fontSize: "0.85rem",
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
                  <div className="title">{t("proposalAction.comments", "Comments")}</div>
                </div>

                <div className="reviews">
                  <Feedback
                    user={user}
                    projectId={project?.id}
                    status={submitOptions[proposalCard.type]?.status}
                    reviews={
                      project?.reviews?.filter(
                        (review) =>
                          review.stage ===
                          cardTypes[proposalCard?.type].reviewStage
                      ) || []
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div className="title">
                  {t("proposalAction.submitForTitle", {
                    name: submitOptions[proposalCard.type]?.name,
                  }, `Submit your proposal for ${submitOptions[proposalCard.type]?.name}`)}
                </div>

                <div className="subtitle">
                  {t("proposalAction.submitForFeedbackIntro", "Once you submit your proposal for feedback:")}
                  <ul>
                    <li>{t("proposalAction.appearInFeedbackCenter", "Your proposal will appear in the Feedback Center.")}</li>
                    {submitOptions[proposalCard.type]?.description && (
                      <li>{submitOptions[proposalCard.type]?.description}</li>
                    )}
                    <li>{t("proposalAction.cardsLocked", "The cards that are included in the Proposal will be locked. Your teacher can unlock them.")}</li>
                  </ul>
                </div>

                <div className="subtitle">
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
                          <div className="listTitle">{card?.title}</div>
                          <div className="listSubtitle">
                            {card?.settings?.status || t("proposalAction.notStarted", "Not started")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {allCardsCompleted ? (
                  <div className="subtitle">
                    {t("proposalAction.readyToSubmit", "The proposal is ready to be submitted for feedback!")}
                  </div>
                ) : (
                  <div className="subtitle warning">
                    {t("proposalAction.completeAllRequired", "Please complete all required cards before submitting your proposal for feedback.")}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </StyledActionPage>
    </>
  );
}
