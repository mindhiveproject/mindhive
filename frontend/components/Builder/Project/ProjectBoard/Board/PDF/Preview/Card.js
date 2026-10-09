"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@apollo/client";
import { Icon, Accordion } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import ReactHtmlParser from "react-html-parser";
import TipTapEditor from "../../../../../../TipTap/Main";

import { UPDATE_CARD_CONTENT } from "../../../../../../Mutations/Proposal";
import { GET_CARD_CONTENT, PROPOSAL_QUERY } from "../../../../../../Queries/Proposal";
import { getRegularCardVariant } from "../../../../../../Utils/cardVariants";
import { useCardCollabSession } from "../../../../../../../lib/useCardCollabSession";
import {
  useCardHtmlAutosave,
  CARD_TEXT_FIELDS,
} from "../../../../../../../lib/useCardHtmlAutosave";
import StatusChip from "./StatusChip";
import SaveIndicator from "../../SaveIndicator";
import InfoPopover from "../../../../../../DesignSystem/InfoPopover";

// Close the card's collaboration connection after this long without activity.
const IDLE_DISCONNECT_MS = 30000;
// How recent `lastTimeEdited` must be for "Being edited by" to show.
const EDITING_BADGE_WINDOW_MS = 90000;

export default function Card({
  card,
  cardId,
  user,
  submitStatuses = {},
  proposalId,
  isActive = false,
  onActivate,
  onDeactivate,
  onSaveStateChange,
}) {
  const { t } = useTranslation("builder");
  const [focusRequest, setFocusRequest] = useState(null); // { field, x, y } of the click that activated the card
  const [peerNames, setPeerNames] = useState([]);
  const [, setBadgeTick] = useState(0);
  const [originalActive, setOriginalActive] = useState(false); // For accordion state, default collapsed
  const [commentsActive, setCommentsActive] = useState(false); // For comments accordion state, default collapsed

  const containerRef = useRef(null);
  const idleTimerRef = useRef(null);

  const isUsedLoggedIn = user;

  const editableFields = {
    content: !!isUsedLoggedIn && !card.isLocked,
    revisedContent:
      !!isUsedLoggedIn && card.isLocked && !!card.settings?.includeInReport,
    comment: !!isUsedLoggedIn,
  };
  const canEditAnyField = CARD_TEXT_FIELDS.some((field) => editableFields[field]);

  const session = useCardCollabSession({
    documentName: cardId ? `proposalCard:${cardId}` : null,
    active: isActive && canEditAnyField,
  });
  const collabProvider = session.status === "synced" ? session.provider : null;
  // Editors stay read-only until we know whether Yjs or the HTML columns own them,
  // so nothing typed in between can be dropped when the editors rebind.
  const editorsReady = !!collabProvider || session.status === "unavailable";

  const { values, saveState, handleFieldUpdate, flushSave, retry } =
    useCardHtmlAutosave({
      card,
      cardId,
      collabLive: !!collabProvider && session.connected,
      bound: !!collabProvider,
    });

  const collaborationUser = {
    id: user?.id || null,
    name:
      user?.username ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      "Editor",
  };

  const refetchQueries = [
    { query: GET_CARD_CONTENT, variables: { id: cardId } },
    ...(proposalId ? [{ query: PROPOSAL_QUERY, variables: { id: proposalId } }] : []),
  ];

  const [updateCardStatus, { loading: statusLoading }] = useMutation(UPDATE_CARD_CONTENT, {
    refetchQueries,
  });

  // Status can be changed until the card is locked. Cards used in several review
  // steps stay editable until the project report is submitted.
  const hasMultipleReviewSteps = card?.settings?.includeInReviewSteps?.length > 1;
  const isProjectReportSubmitted = submitStatuses?.ACTION_PROJECT_REPORT === "SUBMITTED";
  const canEditStatus =
    !!isUsedLoggedIn &&
    (!card.isLocked || (hasMultipleReviewSteps && !isProjectReportSubmitted));

  useEffect(() => {
    onSaveStateChange?.({
      pending: saveState === "pending" || saveState === "saving" || saveState === "error",
      failed: saveState === "error",
    });
  }, [saveState, onSaveStateChange]);

  // ── Connection lifecycle ───────────────────────────────────────────────────

  const latestRef = useRef({});
  latestRef.current = { flushSave, onDeactivate, onSaveStateChange };

  const checkIdle = () => {
    if (containerRef.current?.contains(document.activeElement)) {
      idleTimerRef.current = setTimeout(checkIdle, IDLE_DISCONNECT_MS);
      return;
    }
    latestRef.current.flushSave();
    latestRef.current.onDeactivate?.();
  };

  const touchActivity = () => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(checkIdle, IDLE_DISCONNECT_MS);
  };

  // Only reaching for an editor connects the card; anything else just keeps
  // an open connection alive.
  const handleActivity = (event) => {
    if (!canEditAnyField) return;
    touchActivity();
    if (isActive) return;
    const fieldEl = event.target?.closest?.("[data-collab-field]");
    const field = fieldEl?.dataset.collabField;
    if (!field || !editableFields[field]) return;
    setFocusRequest({ field, x: event.clientX, y: event.clientY });
    onActivate?.();
  };

  // The request is consumed once the editors have rebound and become editable.
  useEffect(() => {
    if (!editorsReady || !focusRequest) return undefined;
    const timer = setTimeout(() => setFocusRequest(null), 500);
    return () => clearTimeout(timer);
  }, [editorsReady, focusRequest]);

  // Evicted by another card, or idle: save before the connection closes.
  useEffect(() => {
    if (!isActive) {
      clearTimeout(idleTimerRef.current);
      flushSave();
    }
  }, [isActive, flushSave]);

  // The autosave hook flushes on unmount; release the connection slot too.
  useEffect(
    () => () => {
      clearTimeout(idleTimerRef.current);
      latestRef.current.onDeactivate?.();
      latestRef.current.onSaveStateChange?.(null);
    },
    []
  );

  // ── Who else is editing ────────────────────────────────────────────────────

  useEffect(() => {
    const awareness = collabProvider?.awareness;
    if (!awareness) {
      setPeerNames([]);
      return undefined;
    }
    const update = () => {
      const names = new Set();
      awareness.getStates().forEach((state, clientId) => {
        const name = state?.user?.name;
        if (clientId !== awareness.clientID && name && name !== collaborationUser.name) {
          names.add(name);
        }
      });
      setPeerNames([...names]);
    };
    update();
    awareness.on("change", update);
    return () => awareness.off("change", update);
  }, [collabProvider, collaborationUser.name]);

  // Between connections, fall back to the last edit the server recorded.
  const lastEditor = card?.isEditedBy?.username;
  const lastEditedAt = card?.lastTimeEdited ? new Date(card.lastTimeEdited).getTime() : 0;
  const recentEditRemainingMs = lastEditedAt + EDITING_BADGE_WINDOW_MS - Date.now();
  const recentEditByOther =
    !!lastEditor && lastEditor !== user?.username && recentEditRemainingMs > 0;

  // Re-render when the badge should expire, even if no new data arrives.
  useEffect(() => {
    if (!recentEditByOther) return undefined;
    const timer = setTimeout(() => setBadgeTick((tick) => tick + 1), recentEditRemainingMs + 100);
    return () => clearTimeout(timer);
  }, [recentEditByOther, lastEditedAt]);

  let otherEditors = [];
  if (collabProvider) otherEditors = peerNames;
  else if (recentEditByOther) otherEditors = [lastEditor];

  const editorProps = (field) => ({
    content: values[field],
    onUpdate: (html, meta) => handleFieldUpdate(field, html, meta),
    isEditable: editableFields[field] && editorsReady,
    collaboration: collabProvider ? { provider: collabProvider, field } : null,
    collaborationUser,
    focusRequest: focusRequest?.field === field ? focusRequest : null,
    toolbarVisible: true,
  });

  // Until the card is connected, its editors are read-only; let keyboard users
  // reach them so focusing one connects the card.
  const editorWrapperProps = (field) => ({
    "data-collab-field": field,
    tabIndex: editableFields[field] && !editorsReady ? 0 : undefined,
  });

  const mediaLibraryProps = {
    mediaLibraryId: proposalId,
    mediaLibrarySource: {
      sourceType: "projectCard",
      sourceId: cardId ?? null,
      createdWith: "upload",
    },
    mediaDisplayedInProposalCardId: cardId ?? null,
  };

  // Get card variant based on settings and statuses (same mechanism as Builder/Card.js)
  const cardVariant = getRegularCardVariant(card, submitStatuses);

  // Determine icon path for feedback tag (same as Builder/Card.js)
  const getFeedbackIcon = () => {
    if (cardVariant.variant === "FEEDBACK_SUBMITTED") {
      return "/assets/icons/status/publicTemplatesubmitted.svg"; // Checkmark icon
    } else if (cardVariant.variant === "FEEDBACK_NON_SUBMITTED") {
      return "/assets/icons/status/publicTemplate.svg"; // Clipboard icon
    }
    return "/assets/icons/status/publicTemplate.svg"; // Default
  };

  // Get feedback info for display (icon and bgColor based on submission status)
  const getFeedbackInfo = () => {
    if (cardVariant.variant === "FEEDBACK_SUBMITTED") {
      return {
        icon: getFeedbackIcon(),
        bgColor: "#def8fb", // Same as feedback-submitted CSS
      };
    } else if (cardVariant.variant === "FEEDBACK_NON_SUBMITTED") {
      return {
        icon: getFeedbackIcon(),
        bgColor: "#FDF2D0", // Same as feedback-non-submitted CSS
      };
    }
    // Default for NO_FEEDBACK or other cases
    return {
      icon: "/assets/icons/status/publicTemplate.svg",
      bgColor: "#def8fb",
    };
  };

  const feedbackInfo = getFeedbackInfo();
  const statusText = card?.settings?.status || "Completed";

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    if (!canEditStatus || statusLoading) return;
    try {
      await updateCardStatus({
        variables: {
          id: cardId,
          settings: { ...card.settings, status: newStatus },
          // Include existing relationships to satisfy mutation requirements
          assignedTo: card?.assignedTo?.map((profile) => ({ id: profile?.id })) || [],
          resources: card?.resources?.map((resource) => ({ id: resource?.id })) || [],
          assignments: card?.assignments?.map((assignment) => ({ id: assignment?.id })) || [],
          tasks: card?.tasks?.map((task) => ({ id: task?.id })) || [],
          studies: card?.studies?.map((study) => ({ id: study?.id })) || [],
        },
      });
    } catch (error) {
      console.error("Failed to update card status:", error);
    }
  };

  // Get card content to display
  const getCardContent = () => {
    if (card.isLocked) {
      return card?.revisedContent || card?.content || "";
    }
    return values.content || "";
  };

  return (
    <div
      ref={containerRef}
      onPointerDownCapture={handleActivity}
      onFocusCapture={handleActivity}
      onKeyDownCapture={canEditAnyField ? touchActivity : undefined}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #E6E6E6",
        padding: "16px",
        boxShadow: "2px 2px 8px 0px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        touchAction: "pan-y",
        WebkitUserDrag: "none",
        userDrag: "none",
      }}
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault();
        return false;
      }}
    >
      {/* Card Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        position: "relative",
        zIndex: "auto",
        }}
      >
        {/* Left side - Icon and Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {/* Feedback Status Icon */}
          {cardVariant.variant !== "NO_FEEDBACK" && (
            <div
              style={{
                backgroundColor: feedbackInfo.bgColor,
                border: "1px solid #a1a1a1",
                borderRadius: "8px",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={feedbackInfo.icon}
                alt="feedback status"
                draggable="false"
                style={{
                  width: "24px",
                  height: "24px",
                }}
              />
            </div>
          )}
          {/* Card Title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <div
              className="MH-Type-Title-Base"
              style={{
                color: "#000000",
              }}
            >
              {card?.section?.title && (
                <span
                  className="MH-Type-Body-Base"
                  style={{
                    color: "#626262",
                    marginBottom: "2px",
                    display: "block",
                  }}
                >
                  {card.section.title}
                </span>
              )}
              {card?.title || ""}
            </div>
            {otherEditors.length > 0 && (
              <span
                className="MH-Type-Label-Base"
                style={{
                  marginTop: "6px",
                  padding: "2px 8px",
                  borderRadius: "8px",
                  backgroundColor: "#FDF2D0",
                  color: "#171717",
                }}
              >
                {t(
                  "proposalPDF.autosave.beingEditedBy",
                  { names: otherEditors.join(", ") },
                  { default: "Being edited by {{names}}" }
                )}
              </span>
            )}
          </div>
        </div>

        {/* Right side - Save indicator and Status Chip */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {canEditAnyField && (
            <SaveIndicator
              saveState={saveState}
              connecting={session.status === "connecting"}
              onRetry={retry}
            />
          )}
          <StatusChip
            value={statusText}
            onStatusChange={handleStatusChange}
            canEdit={canEditStatus}
            loading={statusLoading}
          />
        </div>
      </div>

      {/* Card Content - Submission */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            // border: "1px solid #a1a1a1",
            // borderRadius: "8px",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {card.isLocked ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <h2 className="MH-Type-Title-Base" style={{ margin: 0 }}>{t("mainCard.originalSubmission", "Original Submission")}</h2>
                <InfoPopover
                  content={t("mainCard.originalSubmissionTooltip", "This is the content you originaly submitted to the Feedback Center. We copied it bellow for you to make edits and conserved a 'Revised content'.")}
                  ariaLabel={t("mainCard.originalSubmission", "Original Submission")}
                />
              </div>
              <Accordion styled={card.isLocked ? false : true} fluid style={{ border: "none" }}>
                <Accordion.Title
                  active={originalActive}
                  onClick={() => setOriginalActive(!originalActive)}
                >
                  <Icon name="dropdown" />
                  {t("mainCard.seeOriginalSubmission", "Click to see your original submission")}
                </Accordion.Title>
                <Accordion.Content active={originalActive}>
                  <div>{ReactHtmlParser(card?.content || "")}</div>
                </Accordion.Content>
              </Accordion>
              {card.settings?.includeInReport && (
                <div style={{ marginTop: "24px" }}>
                  <h2 className="MH-Type-Title-Base" style={{ margin: 0 }}>{t("mainCard.revisedContent", "Revised Content")}</h2>
                  {/* <h2>{t("mainCard.newSubmission", "New Submission")}</h2> */}
                  {isUsedLoggedIn ? (
                    <div {...editorWrapperProps("revisedContent")}>
                      <TipTapEditor
                        {...editorProps("revisedContent")}
                        {...mediaLibraryProps}
                      />
                    </div>
                  ) : (
                    <div>{ReactHtmlParser(getCardContent())}</div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {isUsedLoggedIn ? (
                <div {...editorWrapperProps("content")}>
                  <TipTapEditor
                    {...editorProps("content")}
                    {...mediaLibraryProps}
                  />
                </div>
              ) : (
                <div>{ReactHtmlParser(getCardContent())}</div>
              )}
            </>
          )}
          {/* Comments Accordion - Shared for both locked and unlocked cards */}
          <div style={{ marginTop: "24px", marginLeft: card.isLocked ? "4px" : "0", border: "none" }}>
            <Accordion styled={false} fluid style={{ border: "none" }}>
              <Accordion.Title
                active={commentsActive}
                onClick={() => setCommentsActive(!commentsActive)}
                style={{ border: "none" }}
              >
                <Icon name="dropdown" />
                Comments
              </Accordion.Title>
              <Accordion.Content active={commentsActive} style={{ border: "none" }}>
                {isUsedLoggedIn ? (
                  <div {...editorWrapperProps("comment")}>
                    <TipTapEditor
                      {...editorProps("comment")}
                      limitedToolbar={true}
                      placeholder={t("mainCard.commentsPlaceholder", "Add your comment here...")}
                      style={{
                        flex: 1,
                        width: "100%",
                        minHeight: "100px",
                        border: "none",
                        borderRadius: "8px",
                        padding: "10px",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "10px",
                      overflow: "auto",
                      minHeight: "100px",
                      border: "none",
                    }}
                  >
                    {values.comment
                      ? ReactHtmlParser(values.comment)
                      : t("mainCard.noComments", "No comments available.")}
                  </div>
                )}
              </Accordion.Content>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
