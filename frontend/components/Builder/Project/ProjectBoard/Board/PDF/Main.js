import absoluteUrl from "next-absolute-url";
import { useQuery } from "@apollo/client";
import { PROPOSAL_QUERY } from "../../../../../Queries/Proposal";
import moment from "moment";
import Head from "next/head";
import Preview from "./Preview/Main";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

export default function ProposalPDF({ 
  proposalId, 
  user,
  selectedStatuses = [],
  setSelectedStatuses,
  selectedReviewSteps = [],
  setSelectedReviewSteps,
  selectedAssignedUsers = [],
  setSelectedAssignedUsers,
}) {
  const { t } = useTranslation("builder");
  const { origin } = absoluteUrl();
  const { data, loading, error } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
  });

  const proposal = data?.proposalBoard || {};
  const title = proposal?.title || "";
  const description = proposal?.description || "";
  const sections = proposal?.sections || [];
  const study = proposal?.study || {};

  // If props are not provided, use local state as fallback (for backwards compatibility)
  const [localSelectedStatuses, setLocalSelectedStatuses] = useState(["Not started", "In progress"]);
  const [localSelectedReviewSteps, setLocalSelectedReviewSteps] = useState([]);
  const [localSelectedAssignedUsers, setLocalSelectedAssignedUsers] = useState([]);
  
  const effectiveSelectedStatuses = setSelectedStatuses !== undefined ? selectedStatuses : localSelectedStatuses;
  const effectiveSetSelectedStatuses = setSelectedStatuses !== undefined ? setSelectedStatuses : setLocalSelectedStatuses;
  const effectiveSelectedReviewSteps = setSelectedReviewSteps !== undefined ? selectedReviewSteps : localSelectedReviewSteps;
  const effectiveSetSelectedReviewSteps = setSelectedReviewSteps !== undefined ? setSelectedReviewSteps : setLocalSelectedReviewSteps;
  const effectiveSelectedAssignedUsers =
    setSelectedAssignedUsers !== undefined
      ? selectedAssignedUsers
      : localSelectedAssignedUsers;
  const effectiveSetSelectedAssignedUsers =
    setSelectedAssignedUsers !== undefined
      ? setSelectedAssignedUsers
      : setLocalSelectedAssignedUsers;

  // Status options for dropdown (icons removed)
  const statusOptions = [
    {
      key: "inProgress",
      text: t("statusCard.inProgress", "In progress"),
      value: "In progress",
      className: "info-status status-in-progress",
    },
    {
      key: "completed",
      text: t("statusCard.completed", "Completed"),
      value: "Completed",
      className: "info-status status-completed",
    },
    {
      key: "helpNeeded",
      text: t("statusCard.helpNeeded", "Help needed"),
      value: "Help needed",
      className: "info-status status-help-needed",
    },
    {
      key: "comments",
      text: t("statusCard.comments", "Comments"),
      value: "Comments",
      className: "info-status status-comments",
    },
    {
      key: "notStarted",
      text: t("statusCard.notStarted", "Not started"),
      value: "Not started",
      className: "info-status status-not-started",
    },
    {
      key: "needsRevision",
      text: t("statusCard.needsRevision", "Needs revision"),
      value: "Needs revision",
      className: "info-status status-needs-revision",
    },
  ];

  // Review steps options for dropdown
  const reviewStepOptions = [
    {
      key: "actionSubmit",
      text: t("mainCard.reviewOptions.proposal", "Proposal"),
      value: "ACTION_SUBMIT",
    },
    {
      key: "actionPeerFeedback",
      text: t("mainCard.reviewOptions.peerFeedback", "Peer Feedback"),
      value: "ACTION_PEER_FEEDBACK",
    },
    {
      key: "actionCollectingData",
      text: t("mainCard.reviewOptions.collectingData", "Collecting Data"),
      value: "ACTION_COLLECTING_DATA",
    },
    {
      key: "actionProjectReport",
      text: t("mainCard.reviewOptions.projectReport", "Project Report"),
      value: "ACTION_PROJECT_REPORT",
    },
  ];

  // Submit statuses from proposal
  const submitStatuses = {
    ACTION_SUBMIT: proposal?.submitProposalStatus,
    ACTION_PEER_FEEDBACK: proposal?.peerFeedbackStatus,
    ACTION_PROJECT_REPORT: proposal?.projectReportStatus,
  };

  // Order sections by position
  const orderedSections = [...sections].sort((a, b) => a.position - b.position);

  // Unique assigned users across the whole board (used for filter UI)
  const assignedUserOptions = orderedSections
    .flatMap((section) => section?.cards || [])
    .flatMap((card) => card?.assignedTo || [])
    .filter(Boolean)
    .reduce((acc, u) => {
      if (!u?.id) return acc;
      if (acc.some((x) => x.id === u.id)) return acc;
      acc.push({ id: u.id, username: u.username || "" });
      return acc;
    }, [])
    .sort((a, b) => (a.username || "").localeCompare(b.username || ""));

  // Generate content for PDF
  const allCardsContent = orderedSections.map((section) => {
    const orderedCards = [...section.cards].sort(
      (a, b) => a.position - b.position
    );
    const actionCards = orderedCards
      .filter(
        (card) =>
          card?.type === "ACTION_SUBMIT" ||
          card?.type === "ACTION_PEER_FEEDBACK" ||
          card?.type === "ACTION_COLLECTING_DATA" ||
          card?.type === "ACTION_PROJECT_REPORT"
      )
      .map((c) => c?.type);
    const submissionStage = actionCards?.length ? actionCards[0] : undefined;
    const submissionStatus = submitStatuses[submissionStage];
    const filteredCardsWithTitles = orderedCards
      .filter(
        (card) =>
          (effectiveSelectedStatuses.length === 0 ||
            effectiveSelectedStatuses.includes(card?.settings?.status)) &&
          card?.settings?.includeInReport &&
          (effectiveSelectedReviewSteps.length === 0 ||
            effectiveSelectedReviewSteps.some((step) =>
              card?.settings?.includeInReviewSteps?.includes(step)
            )) &&
          (effectiveSelectedAssignedUsers.length === 0 ||
            effectiveSelectedAssignedUsers.some((userId) =>
              (card?.assignedTo || []).some((u) => u?.id === userId)
            ))
      )
      .map((card) => {
        const isLocked =
          submissionStatus === "SUBMITTED" ||
          card?.settings?.includeInReviewSteps?.some(
            (step) => submitStatuses[step] === "SUBMITTED"
          );
        const cardContent = isLocked
          ? card?.revisedContent || card?.content
          : card?.content;
        return `<h3>${card?.title}</h3>${cardContent}`;
      });
    const cardsWithSectionTitles = `<h2>${
      section?.title
    }</h2>${filteredCardsWithTitles.join("")}`;
    return cardsWithSectionTitles;
  });
  const cardsContent = allCardsContent.flat().join("");
  let studyURL = "";
  if (study?.slug) {
    studyURL = `<h3>Study URL: ${origin}/studies/${study?.slug}</h3>`;
  }
  const content = `<h1>${title}</h1><h2>${description}</h2>${studyURL}${cardsContent}`;

  const studyTitle = study?.title;
  const date = moment().format("MM-D-YYYY");

  // Get cards for Preview component
  const cards = orderedSections.map((section) => {
    const orderedCards = [...section.cards].sort(
      (a, b) => a.position - b.position
    );
    const actionCards = orderedCards
      .filter(
        (card) =>
          card?.type === "ACTION_SUBMIT" ||
          card?.type === "ACTION_PEER_FEEDBACK" ||
          card?.type === "ACTION_COLLECTING_DATA" ||
          card?.type === "ACTION_PROJECT_REPORT"
      )
      .map((c) => c?.type);
    const submissionStage = actionCards?.length ? actionCards[0] : undefined;
    const submissionStatus = submitStatuses[submissionStage];
    const filteredCards = orderedCards
      .filter(
        (card) =>
          (effectiveSelectedStatuses.length === 0 ||
            effectiveSelectedStatuses.includes(card?.settings?.status)) &&
          card?.settings?.includeInReport &&
          (effectiveSelectedReviewSteps.length === 0 ||
            effectiveSelectedReviewSteps.some((step) =>
              card?.settings?.includeInReviewSteps?.includes(step)
            )) &&
          (effectiveSelectedAssignedUsers.length === 0 ||
            effectiveSelectedAssignedUsers.some((userId) =>
              (card?.assignedTo || []).some((u) => u?.id === userId)
            ))
      )
      .map((card) => ({
        ...card,
        isLocked:
          submissionStatus === "SUBMITTED" ||
          card?.settings?.includeInReviewSteps?.some(
            (step) => submitStatuses[step] === "SUBMITTED"
          ),
      }));
    return filteredCards;
  });

  // Helper function to toggle status selection
  const toggleStatus = (status) => {
    effectiveSetSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  // Helper function to toggle review step selection
  const toggleReviewStep = (step) => {
    effectiveSetSelectedReviewSteps((prev) =>
      prev.includes(step)
        ? prev.filter((s) => s !== step)
        : [...prev, step]
    );
  };

  // Helper function to toggle assigned user selection
  const toggleAssignedUser = (userId) => {
    effectiveSetSelectedAssignedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Get review step icon
  const getReviewStepIcon = (step) => {
    // These icons would need to be created or mapped to existing assets
    // For now, using a placeholder approach
    const iconMap = {
      ACTION_SUBMIT: "/assets/icons/status/publicTemplate.svg",
      ACTION_PEER_FEEDBACK: "/assets/icons/status/publicTemplate.svg",
      ACTION_COLLECTING_DATA: "/assets/icons/status/publicTemplate.svg",
      ACTION_PROJECT_REPORT: "/assets/icons/status/publicTemplate.svg",
    };
    return iconMap[step] || "/assets/icons/status/publicTemplate.svg";
  };

  return (
    <>
      <Head>
        <title>
          {studyTitle}-{date}
        </title>
        <style dangerouslySetInnerHTML={{
          __html: `
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .proposal-pdf-filter-sidebar {
              order: 1;
            }
            .proposal-pdf-cards-list {
              order: 0;
            }
            @media (max-width: 768px) {
              .proposal-pdf-container {
                flex-direction: column !important;
                padding: 0 16px 16px 16px !important;
                gap: 16px !important;
              }
              .proposal-pdf-filter-sidebar {
                width: 100% !important;
                order: -1 !important;
              }
              .proposal-pdf-cards-list {
                max-width: 100% !important;
                order: 0 !important;
              }
            }
          `
        }} />
      </Head>
      <div
        className="proposalPDF"
        style={{
          backgroundColor: "#f6f9f8",
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          margin: 0,
        }}
      >
        <div
          className="proposal-pdf-container"
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "stretch",
            justifyContent: "left",
            padding: "0 0px 24px 0px",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* Right Column - Filter Sidebar */}
          <div
            className="proposal-pdf-filter-sidebar"
            style={{
              width: "250px",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              overflowY: "auto",
              overflowX: "hidden",
              position: "relative",
              zIndex: 0,
            }}
          >
            {/* Filter by title */}
            <h2
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 600,
                fontSize: "22px",
                lineHeight: "28px",
                letterSpacing: "0.15px",
                color: "#171717",
                margin: 0,
              }}
            >
              {t("proposalPDF.filters.title", "Filter by")}
            </h2>

            {/* Status Filters */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <label
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 600,
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "0.15px",
                  color: "#171717",
                  marginBottom: "4px",
                }}
              >
                {t("board.status", "Status")}
              </label>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {statusOptions.map((option) => {
                  const isSelected = effectiveSelectedStatuses.includes(option.value);
                  return (
                    <button
                      key={option.key}
                      onClick={() => toggleStatus(option.value)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: isSelected
                          ? "6px 8px 6px 12px"
                          : "6px 12px",
                        height: "32px",
                        border: "1px solid #a1a1a1",
                        borderRadius: "8px",
                        backgroundColor: isSelected ? "#FDF2D0" : "#ffffff",
                        cursor: "pointer",
                        fontFamily: "Nunito, sans-serif",
                        fontWeight: 600,
                        fontSize: "14px",
                        lineHeight: "20px",
                        letterSpacing: "0.15px",
                        color: "#171717",
                        transition: "background-color 0.2s",
                        width: "fit-content",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = "#f9f9f9";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = "#ffffff";
                        }
                      }}
                    >
                      <span>{option.text}</span>
                      {isSelected && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "18px",
                            height: "18px",
                            cursor: "pointer",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatus(option.value);
                          }}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                              fill="#171717"
                            />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Review Steps Filters */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <label
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 600,
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "0.15px",
                  color: "#171717",
                  marginBottom: "4px",
                }}
              >
                {t("proposalPDF.filters.reviewSteps", "Review Steps")}
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {reviewStepOptions.map((option) => {
                  const isSelected = effectiveSelectedReviewSteps.includes(
                    option.value
                  );
                  return (
                    <button
                      key={option.key}
                      onClick={() => toggleReviewStep(option.value)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: isSelected
                          ? "6px 8px 6px 8px"
                          : "6px 8px 6px 8px",
                        height: "32px",
                        border: "1px solid #a1a1a1",
                        borderRadius: "8px",
                        backgroundColor: isSelected ? "#FDF2D0" : "#ffffff",
                        cursor: "pointer",
                        fontFamily: "Nunito, sans-serif",
                        fontWeight: 600,
                        fontSize: "14px",
                        lineHeight: "20px",
                        letterSpacing: "0.15px",
                        color: "#171717",
                        transition: "background-color 0.2s",
                        width: "fit-content",
                        justifyContent: "flex-start",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = "#f9f9f9";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = "#ffffff";
                        }
                      }}
                    >
                      <img
                        src={getReviewStepIcon(option.value)}
                        alt=""
                        style={{
                          width: "18px",
                          height: "18px",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ flex: 1, textAlign: "left", whiteSpace: "nowrap" }}>
                        {option.text}
                      </span>
                      {isSelected && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "18px",
                            height: "18px",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleReviewStep(option.value);
                          }}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                              fill="#171717"
                            />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assigned People Filters */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <label
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 600,
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "0.15px",
                  color: "#171717",
                  marginBottom: "4px",
                }}
              >
                {t("board.filterByAssignedTo", "Filter by assigned to")}
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {assignedUserOptions.length === 0 ? (
                  <div
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontWeight: 600,
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0.15px",
                      color: "#6a6a6a",
                      padding: "6px 0",
                    }}
                  >
                    {t(
                      "proposalPDF.filters.assignedTo.empty",
                      "No assigned people on this board yet."
                    )}
                  </div>
                ) : (
                  assignedUserOptions.map((u) => {
                    const isSelected = effectiveSelectedAssignedUsers.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => toggleAssignedUser(u.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: isSelected ? "6px 8px 6px 12px" : "6px 12px",
                          height: "32px",
                          border: "1px solid #a1a1a1",
                          borderRadius: "8px",
                          backgroundColor: isSelected ? "#FDF2D0" : "#ffffff",
                          cursor: "pointer",
                          fontFamily: "Nunito, sans-serif",
                          fontWeight: 600,
                          fontSize: "14px",
                          lineHeight: "20px",
                          letterSpacing: "0.15px",
                          color: "#171717",
                          transition: "background-color 0.2s",
                          width: "fit-content",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = "#f9f9f9";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = "#ffffff";
                          }
                        }}
                      >
                        <span>
                          {u.username || t("proposalPDF.filters.assignedTo.unknown", "Unknown")}
                        </span>
                        {isSelected && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "18px",
                              height: "18px",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAssignedUser(u.id);
                            }}
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                                fill="#171717"
                              />
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Left Column - Cards List */}
          <div
            className="hide-scrollbar proposal-pdf-cards-list"
            style={{
              flex: 1,
              maxWidth: "900px",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              overflowY: "auto",
              overflowX: "hidden",
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none", // IE and Edge
              position: "relative",
              zIndex: 10,
            }}
          >
            {cards.flat().length === 0 ? (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  margin: "24px",
                  padding: "40px",
                  textAlign: "center",
                  boxShadow: "2px 2px 8px 0px rgba(0,0,0,0.1)",
                }}
              >
                <p
                  style={{
                    fontFamily: "Nunito, sans-serif",
                    fontWeight: 600,
                    fontSize: "16px",
                    lineHeight: "24px",
                    letterSpacing: "0.15px",
                    color: "#6a6a6a",
                    margin: 0,
                  }}
                >
                  {t(
                    "proposalPDF.filters.emptyState",
                    "No cards match the selected filters. Please adjust your status, review step, or assigned filters to see cards."
                  )}
                </p>
              </div>
            ) : (
              <Preview cards={cards.flat()} user={user} submitStatuses={submitStatuses} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
