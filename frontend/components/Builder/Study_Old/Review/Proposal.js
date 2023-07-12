import { useState } from "react";
import { useMutation } from "@apollo/client";

import { Icon, Dropdown } from "semantic-ui-react";

import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";
import { UPDATE_PROPOSAL_BOARD } from "../../../Mutations/Proposal";

import { items } from "./Checklist/Template";
import ChecklistItem from "./Checklist/Main";
import Row from "./Reviews/Row";

import {
  StyledReviewSection,
  StyledReviewBoard,
  StyledReviewCard,
} from "../../../styles/StyledReview";

export default function Proposal({
  proposals,
  proposal,
  selectReview,
  setReviewNumber,
  setProposalId,
}) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [updateProposal, { loading }] = useMutation(UPDATE_PROPOSAL_BOARD, {
    refetchQueries: [
      {
        query: PROPOSAL_REVIEWS_QUERY,
        variables: { id: proposal?.id },
      },
    ],
  });

  const takeAction = (action) => {
    if (action === "export") {
      this.exportProposal();
    }
  };

  const exportProposal = () => {
    const url = `/proposals/${proposal?.slug}`;
    const win = window.open(url, "_blank");
  };

  const submitProposal = async () => {
    const res = await updateProposal({
      variables: { id: proposal.id, isSubmitted: true },
    });
  };

  const toggleCheckTo = async (name, newState) => {
    let checklist;
    const prevCheckList = proposal?.checklist || [];
    if (newState) {
      checklist = [...prevCheckList, name];
    } else {
      checklist = [...prevCheckList.filter((item) => item !== name)];
    }
    await updateProposal({
      variables: {
        id: proposal.id,
        checklist,
      },
    });
  };

  return (
    <StyledReviewSection>
      <StyledReviewBoard>
        <StyledReviewCard className="submit">
          <h2>
            Ready to send for review{" "}
            <Dropdown
              inline
              placeholder="Select proposal"
              options={proposals.map((p) => ({
                key: p.id,
                value: p.id,
                text: p.title,
              }))}
              onChange={(event, data) => setProposalId(data?.value)}
              value={proposal?.id}
              className="dropdown"
            />
            ?
          </h2>

          <div className="submitPanel">
            <p>
              When you submit your study as “ready for review,” your proposal
              and study will become available to peer reviewers from other
              participating schools to view and review.
            </p>
            <div className="submitBtnContainer">
              <button
                type="button"
                style={{
                  display: "grid",
                  gridGap: "15px",
                  gridTemplateColumns: "20px 1fr",
                  padding: "15px 20px 10px 20px",
                  background: `${
                    proposal?.isSubmitted ? "#FFF3CD" : "#FFFFFF"
                  }`,
                  border: `${
                    proposal?.isSubmitted
                      ? "2px solid #FFC107"
                      : "2px solid #B3B3B3"
                  }`,
                }}
                disabled={proposal?.isSubmitted}
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to submit this proposal? You will not be able to undo it later."
                    )
                  ) {
                    submitProposal();
                  }
                }}
              >
                {proposal?.isSubmitted ? (
                  <Icon
                    name="check"
                    style={{
                      color: "#FFC107",
                    }}
                  />
                ) : (
                  <img src="/assets/icons/builder/submit.svg" alt="icon" />
                )}

                {proposal?.isSubmitted
                  ? "Submitted for review"
                  : "Submit for review"}
              </button>
            </div>
          </div>
        </StyledReviewCard>

        <StyledReviewCard className="checklist">
          <h2>Pre-review checklist</h2>

          <p>Before you submit for review, make sure to:</p>

          <div className="checklistItems">
            {items.map((item, i) => (
              <ChecklistItem
                item={item}
                key={i}
                isComplete={proposal?.checklist?.includes(item.name)}
                toggleCheckTo={toggleCheckTo}
                updateProposal={updateProposal}
                takeAction={takeAction}
                isSubmitted={!!proposal?.isSubmitted}
              />
            ))}
          </div>
        </StyledReviewCard>

        <StyledReviewCard className="reviews">
          <h2>Reviews</h2>
          {proposal?.reviews && proposal?.reviews.length ? (
            <div className="reviewsCards">
              <p>All individual reviews and syntheses are available here:</p>
              {proposal.reviews
                .filter((review) => review.stage === "SYNTHESIS")
                .map((review, num) => (
                  <Row
                    key={num}
                    number={num + 1}
                    review={review}
                    stage="SYNTHESIS"
                    selectReview={selectReview}
                  />
                ))}

              <a
                className="allReviewsToggle"
                onClick={() => setShowAllReviews(!showAllReviews)}
              >
                {showAllReviews ? "Hide" : "Show"} all reviews
              </a>

              {showAllReviews && (
                <>
                  {proposal.reviews
                    .filter((review) => review.stage === "INDIVIDUAL")
                    .map((review, num) => (
                      <Row
                        key={num}
                        number={num + 1}
                        review={review}
                        stage="INDIVIDUAL"
                        selectReview={selectReview}
                      />
                    ))}
                </>
              )}
            </div>
          ) : (
            <div className="reviewsPlaceholder">
              <p>
                <strong>You don’t have any reviews yet</strong>
              </p>
              <p>
                Once you mark your study as ready for review and your peers have
                reviewed and synthesized their comments, you will see your
                reviews here.
              </p>
            </div>
          )}
        </StyledReviewCard>
      </StyledReviewBoard>
    </StyledReviewSection>
  );
}
