import { useState } from "react";
import { useQuery } from "@apollo/client";
import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";
import moment from "moment";
import Link from "next/link";

import JoditEditor from "../../../Jodit/Editor";
import Questions from "./Questions";
import StudyPreview from "./StudyPreview";

export default function ReviewBoard({ query, user }) {
  const { id, tab, action } = query;
  const stage = action === "review" ? "INDIVIDUAL" : "SYNTHESIS";

  const { data, loading, error } = useQuery(PROPOSAL_REVIEWS_QUERY, {
    variables: {
      id: id,
    },
  });

  const proposal = data?.proposalBoard || { sections: [] };

  const { title, description, sections } = proposal;
  const orderedSections = [...sections].sort((a, b) => a.position - b.position);
  const allCardsContent = orderedSections.map((section) => {
    const orderedCards = [...section.cards].sort(
      (a, b) => a.position - b.position
    );
    return orderedCards
      .filter((card) => card?.settings?.status === "Completed")
      .map((card) =>
        [`<h3>${section.title} - `, `${card.title}</h3>`, card.content]
          .flat()
          .join("")
      );
  });

  const cardsContent = allCardsContent.flat().join("");
  let studyURL = "";
  if (proposal?.study?.slug) {
    studyURL = `<h3>Study URL: https://mindhive.science/studies/${proposal?.study?.slug}</h3>`;
  }
  const content = `<h1>${title}</h1><h2>${description}</h2>${studyURL}${cardsContent}`;

  // extracting the study title is problematic as there are several classes
  const studyTitle = proposal?.study?.title;
  const date = moment().format("MM-D-YYYY");

  return (
    <div className="reviewContainer">
      <div className="header">
        <div className="headerLeft">
          <div className="headerMenu">
            <Link
              href={{
                pathname: `/dashboard/review/proposal`,
                query: {
                  id,
                  tab: "proposal",
                  action: "review",
                },
              }}
              className={
                tab === "proposal"
                  ? "headerMenuTitle selectedMenuTitle"
                  : "headerMenuTitle"
              }
            >
              <p>Proposal</p>
            </Link>

            <Link
              href={{
                pathname: `/dashboard/review/proposal`,
                query: {
                  id,
                  tab: "study",
                  action: "review",
                },
              }}
              className={
                tab === "study"
                  ? "headerMenuTitle selectedMenuTitle"
                  : "headerMenuTitle"
              }
            >
              <p>Study page</p>
            </Link>
          </div>
        </div>
      </div>

      <div className="content">
        {(!tab || tab === "proposal") && (
          <JoditEditor readonly setContent={() => {}} content={content} />
        )}
        {tab === "study" && <StudyPreview user={user} proposal={proposal} />}
        {tab === "reviews" && <div>Reviews</div>}
      </div>

      <div className="questions">
        <Questions
          studyId={proposal?.study?.id}
          proposalId={proposal?.id}
          authorId={user?.id}
          stage={stage}
        />
      </div>
    </div>
  );
}
