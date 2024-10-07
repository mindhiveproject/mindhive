import { useMutation } from "@apollo/client";
import Link from "next/link";

import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";
import { STUDY_PROPOSALS_QUERY } from "../../../Queries/Study";
import { UPDATE_PROPOSAL_BOARD } from "../../../Mutations/Proposal";
import { UPDATE_STUDY } from "../../../Mutations/Study";

import { items } from "./Checklist/Template";
import ChecklistItem from "./Checklist/Main";

import {
  StyledReviewSection,
  StyledReviewBoard,
  StyledReviewCard,
} from "../../../styles/StyledReview";

import Feedback from "./Reviews/Main";

export default function Proposal({ query, study }) {
  const proposal = study?.proposalMain || {};

  const [updateProposal, { loading }] = useMutation(UPDATE_PROPOSAL_BOARD, {
    refetchQueries: [
      {
        query: PROPOSAL_REVIEWS_QUERY,
        variables: { id: proposal?.id },
      },
    ],
  });

  const [
    updateStudy,
    {
      data: updateStudyData,
      loading: updateStudyLoading,
      error: updateStudyError,
    },
  ] = useMutation(UPDATE_STUDY, {
    variables: {
      id: study?.id,
    },
    refetchQueries: [
      { query: STUDY_PROPOSALS_QUERY, variables: { id: study?.id } },
    ],
  });

  const takeAction = (action) => {
    if (action === "export") {
      exportProposal();
    }
  };

  const exportProposal = () => {
    const url = `/proposals/${proposal?.id}`;
    window.open(url, "_blank");
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
        id: proposal?.id,
        checklist,
      },
    });
  };

  const updateStudyStatus = async ({ status }) => {
    await updateStudy({
      variables: {
        id: study?.id,
        input: {
          status: status,
        },
      },
    });
    if (status === "IN_REVIEW") {
      submitProposal();
    }
  };

  return (
    <StyledReviewSection>
      <StyledReviewBoard>
        <StyledReviewCard className="submit">
          <h2>Ready to receive feedback on your proposal or study?</h2>
          <p>
            Once you submit your study for review, your proposal and study will
            become available to peer reviews from other participating schools to
            view and review.
            <strong> If you are submitting your brainstorm</strong>, you may
            disregard the checklist below.
            <strong> If you are submitting for final review</strong>, only
            submit once you have completed the checklist below, and are happy
            with your proposal.
          </p>
          <p>
            {study?.status === "SUBMITTED_AS_PROPOSAL" && (
              <strong>
                You have already submitted your proposal for review.
              </strong>
            )}
            {study?.status === "IN_REVIEW" && (
              <strong>
                You have already submitted both your proposal and your study for
                final review.
              </strong>
            )}
          </p>
          <div className="buttons">
            <div
              className={
                study?.status !== "SUBMITTED_AS_PROPOSAL" &&
                study?.status !== "IN_REVIEW"
                  ? `submitBtn active`
                  : `submitBtn locked`
              }
              onClick={() => {
                if (
                  study?.status !== "SUBMITTED_AS_PROPOSAL" &&
                  study?.status !== "IN_REVIEW" &&
                  confirm(
                    "Are you sure you want to submit this proposal? You will not be able to undo it later."
                  )
                ) {
                  updateStudyStatus({ status: "SUBMITTED_AS_PROPOSAL" });
                }
              }}
            >
              {study?.status !== "SUBMITTED_AS_PROPOSAL" &&
              study?.status !== "IN_REVIEW" ? (
                <img src="/assets/icons/review/brain-and-head.svg" />
              ) : (
                <img src="/assets/icons/review/brain-and-head-gray.svg" />
              )}
              <div>Submit Proposal</div>
            </div>

            <div
              className={
                study?.status !== "IN_REVIEW"
                  ? `submitBtn active`
                  : `submitBtn locked`
              }
              onClick={() => {
                if (proposal?.checklist?.length < 5) {
                  return alert(
                    "Before you submit your study for feedback make sure you check that you have completed the checklist"
                  );
                }
                if (
                  study?.status !== "IN_REVIEW" &&
                  confirm(
                    "Are you sure you want to submit this study for feedback? You will not be able to undo it later."
                  )
                ) {
                  updateStudyStatus({ status: "IN_REVIEW" });
                }
              }}
            >
              {study?.status !== "IN_REVIEW" ? (
                <img src="/assets/icons/review/process.svg" />
              ) : (
                <img src="/assets/icons/review/process-gray.svg" />
              )}
              <div>Submit Study for Feedback</div>
            </div>
          </div>
        </StyledReviewCard>

        <StyledReviewCard className="checklist">
          <h2>Before you submit your study for feedback</h2>

          {study?.proposal?.length === 0 && (
            <p>
              Please create your{" "}
              <Link
                href={`/builder/studies?selector=${study?.id}&tab=proposal`}
              >
                proposal
              </Link>{" "}
              first
            </p>
          )}

          {!!study?.proposal?.length && !proposal?.id && (
            <p>
              Please select one{" "}
              <Link
                href={`/builder/studies?selector=${study?.id}&tab=proposal`}
              >
                proposal
              </Link>{" "}
              as your main proposal
            </p>
          )}

          {!!study?.proposal?.length && proposal?.id && (
            <>
              <p>
                Make sure you check that you have completed the following items
              </p>

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
            </>
          )}
        </StyledReviewCard>

        <StyledReviewCard className="reviews">
          <h2>Feedback</h2>
          <p>
            Once you submit your proposal or study, your reviews will appear
            here.
          </p>
          <Feedback query={query} study={study} />
        </StyledReviewCard>
      </StyledReviewBoard>
    </StyledReviewSection>
  );
}
