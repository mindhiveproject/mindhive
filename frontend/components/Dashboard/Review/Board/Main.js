import { useState } from "react";
import absoluteUrl from "next-absolute-url";
import moment from "moment";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import { Dropdown } from "semantic-ui-react";

import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";

import Review from "./Review";
import StudyPreview from "./StudyPreview/Main";
import Presenter from "../../../Jodit/Presenter";
import Reviews from "./Synthesis/Main";

export default function ReviewBoard({ query, user }) {
  const [view, setView] = useState("byQuestion");
  const { origin } = absoluteUrl();
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
    studyURL = `<h3>Study URL: ${origin}/studies/${proposal?.study?.slug}</h3>`;
  }
  const content = `<h1>${title}</h1><h2>${description}</h2>${studyURL}${cardsContent}`;

  // extracting the study title is problematic as there are several classes
  const studyTitle = proposal?.study?.title;
  const date = moment().format("MM-D-YYYY");

  return (
    <div className="reviewContainer">
      <div className="header">
        <div className="headerLeft">
          <div className="backBtn">
            <Link
              href={{
                pathname: `/dashboard/review`,
              }}
            >
              ← Exit {stage === "INDIVIDUAL" ? "review" : "synthesis"}
            </Link>
          </div>
          <div>{studyTitle}</div>

          <div className="headerMenu">
            <Link
              href={{
                pathname: `/dashboard/review/proposal`,
                query: {
                  id,
                  tab: "proposal",
                  action: action,
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
                  action: action,
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

            {stage === "SYNTHESIS" && (
              <Link
                href={{
                  pathname: `/dashboard/review/proposal`,
                  query: {
                    id,
                    tab: "reviews",
                    action: action,
                  },
                }}
                className={
                  tab === "reviews"
                    ? "headerMenuTitle selectedMenuTitle"
                    : "headerMenuTitle"
                }
              >
                <p>Reviews</p>
              </Link>
            )}
          </div>
        </div>

        <div className="headerRight">
          {stage === "SYNTHESIS" && tab === "reviews" && (
            <Dropdown
              fluid
              selection
              defaultValue={view}
              options={[
                {
                  key: "1",
                  text: "Question view",
                  value: "byQuestion",
                  image: {
                    src: "/assets/icons/review/view-question.png",
                  },
                },
                {
                  key: "2",
                  text: "Reviewer view",
                  value: "byReviewer",
                  image: {
                    src: "/assets/icons/review/view-reviewer.png",
                  },
                },
              ]}
              onChange={(event, data) => {
                setView(data.value);
              }}
            />
          )}
        </div>
      </div>

      <div className="content">
        {(!tab || tab === "proposal") && <Presenter content={content} />}
        {tab === "study" && <StudyPreview user={user} proposal={proposal} />}
        {tab === "reviews" && (
          <Reviews
            user={user}
            reviews={
              proposal?.reviews?.filter(
                (review) => review.stage === "INDIVIDUAL"
              ) || []
            }
            view={view}
          />
        )}
      </div>

      <Review
        studyId={proposal?.study?.id}
        proposalId={proposal?.id}
        authorId={user?.id}
        stage={stage}
      />
    </div>
  );
}
