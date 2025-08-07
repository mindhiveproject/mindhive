import absoluteUrl from "next-absolute-url";
import { useQuery } from "@apollo/client";
import { PROPOSAL_QUERY } from "../../../../../Queries/Proposal";
import moment from "moment";
import Head from "next/head";
import Preview from "../../../../../Jodit/Preview/Main";
import { useState } from "react";
import { Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

export default function ProposalPDF({ proposalId, user }) {
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

  // State for selected statuses and review steps
  const [selectedStatuses, setSelectedStatuses] = useState(["Completed"]);
  const [selectedReviewSteps, setSelectedReviewSteps] = useState([]);

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
          selectedStatuses.includes(card?.settings?.status) &&
          card?.settings?.includeInReport &&
          (selectedReviewSteps.length === 0 ||
            selectedReviewSteps.some((step) =>
              card?.settings?.includeInReviewSteps?.includes(step)
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
          selectedStatuses.includes(card?.settings?.status) &&
          card?.settings?.includeInReport &&
          (selectedReviewSteps.length === 0 ||
            selectedReviewSteps.some((step) =>
              card?.settings?.includeInReviewSteps?.includes(step)
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

  return (
    <>
      <Head>
        <title>
          {studyTitle}-{date}
        </title>
      </Head>
      <div className="proposalPDF">
        <div className="status-filter" style={{ marginBottom: "10px" }}>
          <p
            style={{
              marginBottom: "5px",
              fontSize: "12px",
              color: "#333",
              lineHeight: "1.3",
            }}
          >
            Select statuses and review steps to filter cards below (only
            report-included cards shown).
          </p>
          <div
            style={{
              display: "flex",
              gap: "20px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                minWidth: "200px",
              }}
            >
              <label
                style={{
                  marginRight: "8px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                Status:
              </label>
              <Dropdown
                placeholder="Select statuses"
                multiple
                selection
                options={statusOptions}
                value={selectedStatuses}
                onChange={(e, { value }) => setSelectedStatuses(value)}
                style={{ fontSize: "12px", flex: 1 }}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                minWidth: "200px",
              }}
            >
              <label
                style={{
                  marginRight: "8px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                Review Steps:
              </label>
              <Dropdown
                placeholder="Select review steps"
                multiple
                selection
                options={reviewStepOptions}
                value={selectedReviewSteps}
                onChange={(e, { value }) => setSelectedReviewSteps(value)}
                style={{ fontSize: "12px", flex: 1 }}
              />
            </div>
          </div>
        </div>
        <Preview cards={cards.flat()} user={user} />
      </div>
    </>
  );
}
