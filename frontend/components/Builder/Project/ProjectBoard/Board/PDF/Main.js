import absoluteUrl from "next-absolute-url";
import { useQuery } from "@apollo/client";
import { PROPOSAL_QUERY } from "../../../../../Queries/Proposal";
import moment from "moment";
import Head from "next/head";
import Preview from "../../../../../Jodit/Preview/Main";
import { useState } from "react";
import { Dropdown } from "semantic-ui-react";

export default function ProposalPDF({ proposalId, user }) {
  const { origin } = absoluteUrl();
  const { data, loading, error } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
  });

  const proposal = data?.proposalBoard || {};
  const title = proposal?.title || "";
  const description = proposal?.description || "";
  const sections = proposal?.sections || [];
  const study = proposal?.study || {};

  // State for selected statuses
  const [selectedStatuses, setSelectedStatuses] = useState(["Completed"]);

  // Status options for dropdown (icons removed)
  const statusOptions = [
    {
      key: "inProgress",
      text: "In progress",
      value: "In progress",
      className: "info-status status-in-progress",
    },
    {
      key: "completed",
      text: "Completed",
      value: "Completed",
      className: "info-status status-completed",
    },
    {
      key: "helpNeeded",
      text: "Help needed",
      value: "Help needed",
      className: "info-status status-help-needed",
    },
    {
      key: "comments",
      text: "Comments",
      value: "Comments",
      className: "info-status status-comments",
    },
    {
      key: "notStarted",
      text: "Not started",
      value: "Not started",
      className: "info-status status-not-started",
    },
    {
      key: "needsRevision",
      text: "Needs revision",
      value: "Needs revision",
      className: "info-status status-needs-revision",
    },
  ];

  // Order sections by position
  const orderedSections = [...sections].sort((a, b) => a.position - b.position);

  // Generate content for PDF
  const allCardsContent = orderedSections.map((section) => {
    const orderedCards = [...section.cards].sort(
      (a, b) => a.position - b.position
    );
    const filteredCardsWithTitles = orderedCards
      .filter(
        (card) =>
          selectedStatuses.includes(card?.settings?.status) &&
          card?.settings?.includeInReport
      )
      .map((card) => `<h3>${card?.title}</h3>${card?.content}`);
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
    const filteredCards = orderedCards.filter(
      (card) =>
        selectedStatuses.includes(card?.settings?.status) &&
        card?.settings?.includeInReport
    );
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
              color: "#333",
            }}
          >
            Select statuses to filter cards below
          </p>
          <div style={{ display: "grid", width: "fit-content" }}>
            <Dropdown
              placeholder="Select statuses"
              multiple
              selection
              options={statusOptions}
              value={selectedStatuses}
              onChange={(e, { value }) => setSelectedStatuses(value)}
            />
          </div>
        </div>
        <Preview cards={cards.flat()} user={user} />
      </div>
    </>
  );
}
