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
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const prevCardId = useRef(cardId); // Track previous cardId
  const statusDropdownRef = useRef(null);

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

  // Get status icon
  const getStatusIcon = () => {
    const status = card?.settings?.status || "Not started";
    const statusIconMap = {
      "In progress": "/assets/icons/status/inProgress.svg",
      "Completed": "/assets/icons/status/completed.svg",
      "Help needed": "/assets/icons/status/helpNeeded.svg",
      "Comments": "/assets/icons/status/comments.svg",
      "Not started": "/assets/icons/status/notStarted.svg",
      "Needs revision": "/assets/icons/status/TriangleWarning.svg",
    };
    return statusIconMap[status] || "/assets/icons/status/completed.svg";
  };

  // Get status background color and text color based on status
  const getStatusStyles = (status) => {
    const statusStyleMap = {
      "In progress": {
        backgroundColor: "#fdf2d0",
        color: "#666666",
      },
      "Completed": {
        backgroundColor: "#def8fb",
        color: "#55808c",
      },
      "Help needed": {
        backgroundColor: "#edcecd",
        color: "#b9261a",
      },
      "Comments": {
        backgroundColor: "#d8d3e7",
        color: "#7d70ad",
      },
      "Not started": {
        backgroundColor: "#f3f3f3",
        color: "#8a919d",
      },
      "Needs revision": {
        backgroundColor: "#8a2cf6",
        color: "#8a919d",
      },
    };
    return statusStyleMap[status] || statusStyleMap["Completed"];
  };

  // Status options for dropdown
  const statusOptions = [
    {
      key: "inProgress",
      text: t("statusCard.inProgress", "In progress"),
      value: "In progress",
      image: { src: "/assets/icons/status/inProgress.svg" },
    },
    {
      key: "completed",
      text: t("statusCard.completed", "Completed"),
      value: "Completed",
      image: { src: "/assets/icons/status/completed.svg" },
    },
    {
      key: "helpNeeded",
      text: t("statusCard.helpNeeded", "Help needed"),
      value: "Help needed",
      image: { src: "/assets/icons/status/helpNeeded.svg" },
    },
    {
      key: "comments",
      text: t("statusCard.comments", "Comments"),
      value: "Comments",
      image: { src: "/assets/icons/status/comments.svg" },
    },
    {
      key: "notStarted",
      text: t("statusCard.notStarted", "Not started"),
      value: "Not started",
      image: { src: "/assets/icons/status/notStarted.svg" },
    },
    {
      key: "needsRevision",
      text: t("statusCard.needsRevision", "Needs revision"),
      value: "Needs revision",
      image: { src: "/assets/icons/status/TriangleWarning.svg" },
    },
  ];

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    if (!canEditStatus || statusLoading) return;
    
    setStatusDropdownOpen(false);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
    };

    if (statusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [statusDropdownOpen]);

  const currentStatusStyles = getStatusStyles(statusText);

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
          zIndex: statusDropdownOpen ? 1000 : "auto",
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
        <div ref={statusDropdownRef} style={{ position: "relative", zIndex: statusDropdownOpen ? 1001 : "auto" }}>
          <div
            onClick={() => {
              if (canEditStatus && !statusLoading) {
                setStatusDropdownOpen(!statusDropdownOpen);
              }
            }}
            style={{
              backgroundColor: currentStatusStyles.backgroundColor,
              border: "1px solid #a1a1a1",
              borderRadius: "8px",
              padding: "6px 8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "32px",
              cursor: canEditStatus ? "pointer" : "default",
              userSelect: "none",
            }}
          >
            <img
              src={getStatusIcon()}
              alt=""
              draggable="false"
              style={{
                width: "18px",
                height: "18px",
              }}
            />
            <span
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                lineHeight: "20px",
                letterSpacing: "0.15px",
                color: currentStatusStyles.color,
              }}
            >
              {statusText}
            </span>
            {canEditStatus && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  flexShrink: 0,
                  transform: statusDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              >
                <path
                  d="M7 10L12 15L17 10H7Z"
                  fill={currentStatusStyles.color}
                />
              </svg>
            )}
          </div>
          {canEditStatus && statusDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "4px",
                backgroundColor: "#ffffff",
                border: "1px solid #a1a1a1",
                borderRadius: "8px",
                boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
                overflow: "hidden",
                minWidth: "200px",
                zIndex: 10000,
              }}
            >
              {statusOptions.map((option) => {
                const optionStyles = getStatusStyles(option.value);
                const isSelected = option.value === statusText;
                return (
                  <div
                    key={option.key}
                    onClick={() => handleStatusChange(option.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 8px",
                      backgroundColor: isSelected ? optionStyles.backgroundColor : "transparent",
                      color: optionStyles.color,
                      fontFamily: "Nunito, sans-serif",
                      fontWeight: 600,
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0.15px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "#f5f5f5";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <img
                      src={option.image.src}
                      alt=""
                      draggable="false"
                      style={{
                        width: "18px",
                        height: "18px",
                        flexShrink: 0,
                      }}
                    />
                    <span>{option.text}</span>
                  </div>
                );
              })}
            </div>
          )}
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px" , marginBottom: "16px"}}>
                <h2 style={{ margin: 0 }}>{t("mainCard.originalSubmission", "Original Submission")}</h2>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    const tooltip = e.currentTarget.querySelector('.hover-tooltip');
                    if (tooltip) {
                      tooltip.style.opacity = "1";
                      tooltip.style.transform = "translateY(0)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    const tooltip = e.currentTarget.querySelector('.hover-tooltip');
                    if (tooltip) {
                      tooltip.style.opacity = "0";
                      tooltip.style.transform = "translateY(-5px)";
                    }
                  }}
                >
                  <img 
                    src="/assets/icons/info.svg" 
                    alt="info"
                    style={{ 
                      width: "20px", 
                      height: "20px", 
                      flexShrink: 0,
                      filter: "brightness(0) saturate(100%) invert(28%) sepia(8%) saturate(1200%) hue-rotate(240deg) brightness(95%) contrast(85%)"
                    }}
                  />
                  
                  {/* Hover tooltip */}
                  <div 
                    className="hover-tooltip"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "0",
                      width: "400px",
                      background: "#f7f9f8",
                      color: "#625B71",
                      marginTop: "8px",
                      padding: "12px 16px",
                      border: "1px solid #F3F3F3",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontFamily: "Nunito",
                      lineHeight: "20px",
                      opacity: "0",
                      transform: "translateX(-5px)",
                      transition: "all 0.3s ease",
                      pointerEvents: "none",
                      zIndex: 1000,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.10)",
                    }}
                  >
                    <span>{t("mainCard.originalSubmissionTooltip", "This is the content you originaly submitted to the Feedback Center. We copied it bellow for you to make edits and conserved a 'Revised content'.")}</span>
                  </div>
                </div>
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
