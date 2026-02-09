"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@apollo/client";
import { Icon, Accordion } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import ReactHtmlParser from "react-html-parser";
import TipTapEditor from "../../../../../../TipTap/Main";

import { UPDATE_CARD_EDIT, UPDATE_CARD_CONTENT } from "../../../../../../Mutations/Proposal";
import { GET_CARD_CONTENT } from "../../../../../../Queries/Proposal";
import { getRegularCardVariant } from "../../../../../../Utils/cardVariants";
import StatusChip from "./StatusChip";
import InfoTooltip from "./InfoTooltip";

export default function Card({ card, cardId, user, submitStatuses = {} }) {
  const { t } = useTranslation("builder");
  const [content, setContent] = useState(card?.content || "");
  const [revised, setRevised] = useState(
    card?.revisedContent || card?.content || ""
  );
  const [comment, setComment] = useState(card?.comment || "");
  const [hasContentChanged, setHasContentChanged] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle, loading, success
  const [originalActive, setOriginalActive] = useState(false); // For accordion state, default collapsed
  const [commentsActive, setCommentsActive] = useState(false); // For comments accordion state, default collapsed
  const prevCardId = useRef(cardId); // Track previous cardId

  const isUsedLoggedIn = user;

  const [updateCard, { loading }] = useMutation(UPDATE_CARD_EDIT, {
    refetchQueries: [{ query: GET_CARD_CONTENT, variables: { id: cardId } }],
  });

  const [updateCardStatus, { loading: statusLoading }] = useMutation(UPDATE_CARD_CONTENT, {
    refetchQueries: [{ query: GET_CARD_CONTENT, variables: { id: cardId } }],
  });

  // Permission check: can edit if card is not locked
  // Exception: Cards with multiple review steps can be edited until project report is submitted
  const hasMultipleReviewSteps = card?.settings?.includeInReviewSteps?.length > 1;
  const isProjectReportSubmitted = submitStatuses?.ACTION_PROJECT_REPORT === "SUBMITTED";
  const canEditStatus = isUsedLoggedIn && (
    true || 
    // !card.isLocked || 
    (hasMultipleReviewSteps && !isProjectReportSubmitted)
  );

useEffect(() => {
    // Sync content and comment only when cardId changes or on initial mount
    if (prevCardId.current !== cardId) {
      setContent(card?.content || "");
      setRevised(card?.revisedContent || card?.content || "");
      setComment(card?.comment || "");
      setHasContentChanged(false);
      setSaveStatus("idle");
      prevCardId.current = cardId;
    } else {
      // Sync when card prop updates, but only if we haven't made local changes
      // This handles both external updates and refetches after save
      if (!hasContentChanged) {
        // Only sync comment if it changes
        if (card?.comment !== comment) {
          setComment(card?.comment || "");
        }
        // Sync content for unlocked cards if it changes
        if (!card.isLocked && card?.content !== content) {
          setContent(card?.content || "");
        }
        // Sync revised content for locked cards if it changes
        // Only sync if server has a revisedContent value (not null/undefined)
        // This prevents reverting to original content if refetch hasn't completed or returns stale data
        if (card.isLocked) {
          if (card?.revisedContent !== undefined && card?.revisedContent !== null) {
            // Server has revisedContent value, sync it if different
            if (revised !== card.revisedContent) {
              setRevised(card.revisedContent);
            }
          }
          // If server has null/undefined revisedContent, keep local state (might be what we just saved)
        }
      } else {
        // Even if we have local changes, sync comment if it changed externally
        // (comments can be updated independently)
        if (card?.comment !== comment && card?.comment !== undefined) {
          setComment(card?.comment || "");
        }
      }
    }
  }, [card, cardId, saveStatus]);

  const saveChanges = async () => {
    if (!hasContentChanged || loading) return;

    setSaveStatus("loading");
    try {
      const input = { comment };
      if (isUsedLoggedIn && card.settings?.includeInReport) {
        input.revisedContent = revised;
      }
      if (!card.isLocked) {
        input.content = content;
      }
      await updateCard({
        variables: {
          id: cardId,
          input,
        },
      });
      setHasContentChanged(false);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save changes:", error);
      setSaveStatus("idle");
    }
  };

  // Helper function to build specialButton config for TipTap toolbar
  const getSaveButtonConfig = (isRevised = false) => {
    if (!isUsedLoggedIn) return null;
    
    // For revised content button - only show when card is locked and includeInReport is true
    if (isRevised && (!card.isLocked || !card.settings?.includeInReport)) {
      return null;
    }
    
    // For regular content button - only show when card is not locked
    if (!isRevised && card.isLocked) {
      return null;
    }

    const getLabel = () => {
      if (saveStatus === "success") {
        return "Saved";
      }
      if (loading) {
        return "Saving...";
      }
      return isRevised ? "Save Revised" : "Save";
    };

    const getIcon = () => {
      return saveStatus === "success" ? "check" : undefined;
    };

    return {
      label: getLabel(),
      icon: getIcon(),
      onClick: (editor, event) => {
        // Wrap saveChanges to match specialButton onClick signature
        saveChanges();
      },
      disabled: loading || !hasContentChanged,
      loading: loading,
      positive: saveStatus === "success",
      primary: saveStatus !== "success",
      color: saveStatus === "success" ? "#1C8F36" : "#274E5B",
      colorBackground: saveStatus === "success" ? "#E8F7EC" : "#f0f5f5",
    };
  };

  // Helper function to build save button config for comment editor
  const getCommentSaveButtonConfig = () => {
    if (!isUsedLoggedIn) return null;

    const getLabel = () => {
      if (saveStatus === "success") {
        return "Saved";
      }
      if (loading) {
        return "Saving...";
      }
      return "Save";
    };

    const getIcon = () => {
      return saveStatus === "success" ? "check" : undefined;
    };

    return {
      label: getLabel(),
      icon: getIcon(),
      onClick: (editor, event) => {
        // Wrap saveChanges to match specialButton onClick signature
        saveChanges();
      },
      disabled: loading || !hasContentChanged,
      loading: loading,
      positive: saveStatus === "success",
      primary: saveStatus !== "success",
      color: saveStatus === "success" ? "#1C8F36" : "#274E5B",
      colorBackground: saveStatus === "success" ? "#E8F7EC" : "#f0f5f5",
    };
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
    return content || "";
  };

  return (
    <div
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
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 600,
                fontSize: "16px",
                lineHeight: "24px",
                letterSpacing: "0.15px",
                color: "#000000",
              }}
            >
              {card?.section?.title && (
                <span
                  style={{
                    fontFamily: "Nunito, sans-serif",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "16px",
                    letterSpacing: "0.1px",
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
          </div>
        </div>

        {/* Right side - Status Chip */}
        <StatusChip
          value={statusText}
          onStatusChange={handleStatusChange}
          canEdit={canEditStatus}
          loading={statusLoading}
        />
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
                <h2 style={{ margin: 0 }}>{t("mainCard.originalSubmission", "Original Submission")}</h2>
                <InfoTooltip
                  content={t("mainCard.originalSubmissionTooltip", "This is the content you originaly submitted to the Feedback Center. We copied it bellow for you to make edits and conserved a 'Revised content'.")}
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
                  <h2>{t("mainCard.revisedContent", "Revised Content")}</h2>
                  {/* <h2>{t("mainCard.newSubmission", "New Submission")}</h2> */}
                  {isUsedLoggedIn ? (
                      <TipTapEditor
                        content={revised}
                        onUpdate={(newRevised) => {
                          setRevised(newRevised);
                          setHasContentChanged(
                            newRevised !== (card?.revisedContent || card?.content) ||
                              content !== card?.content ||
                              comment !== card?.comment
                          );
                          setSaveStatus("idle");
                        }}
                        isEditable={
                          isUsedLoggedIn && card.settings?.includeInReport
                        }
                        toolbarVisible={true}
                        specialButton={getSaveButtonConfig(true)}
                      />
                  ) : (
                    <div>{ReactHtmlParser(getCardContent())}</div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {isUsedLoggedIn ? (
                  <TipTapEditor
                    content={content}
                    onUpdate={(newContent) => {
                      setContent(newContent);
                      setHasContentChanged(
                        newContent !== card?.content ||
                          revised !== (card?.revisedContent || card?.content) ||
                          comment !== card?.comment
                      );
                      setSaveStatus("idle");
                    }}
                    isEditable={!card.isLocked}
                    toolbarVisible={true}
                    specialButton={getSaveButtonConfig(false)}
                  />
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
                    <TipTapEditor
                      content={comment}
                      onUpdate={(newComment) => {
                        setComment(newComment);
                        setHasContentChanged(
                          newComment !== card?.comment ||
                            content !== card?.content ||
                            revised !== (card?.revisedContent || card?.content)
                        );
                      }}
                      isEditable={isUsedLoggedIn}
                      toolbarVisible={true}
                      limitedToolbar={true}
                      specialButton={getCommentSaveButtonConfig()}
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
                ) : (
                  <div
                    style={{
                      padding: "10px",
                      overflow: "auto",
                      minHeight: "100px",
                      border: "none",
                    }}
                  >
                    {comment || t("mainCard.noComments", "No comments available.")}
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
