import { useMutation } from "@apollo/client";
import Link from "next/link";

import { UPDATE_PROJECT_BOARD } from "../../../../../../Mutations/Proposal";
import { PROPOSAL_QUERY } from "../../../../../../Queries/Proposal";

// import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";
// import { STUDY_PROPOSALS_QUERY } from "../../../Queries/Study";
// import { UPDATE_PROPOSAL_BOARD } from "../../../Mutations/Proposal";
// import { UPDATE_STUDY } from "../../../Mutations/Study";
// import { items } from "./Checklist/Template";
// import ChecklistItem from "./Checklist/Main";

import {
  StyledReviewSection,
  StyledReviewBoard,
  StyledReviewCard,
} from "../../../../../../styles/StyledReview";

// import Feedback from "./Reviews/Main";

export default function Proposal({ query, proposal }) {
  const [updateProposal, { loading }] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: [
      {
        query: PROPOSAL_QUERY,
        variables: { id: proposal?.id },
      },
    ],
  });

  // const [
  //   updateStudy,
  //   {
  //     data: updateStudyData,
  //     loading: updateStudyLoading,
  //     error: updateStudyError,
  //   },
  // ] = useMutation(UPDATE_STUDY, {
  //   variables: {
  //     id: proposal?.study?.id,
  //   },
  //   refetchQueries: [
  //     { query: STUDY_PROPOSALS_QUERY, variables: { id: proposal?.study?.id } },
  //   ],
  // });

  // const takeAction = (action) => {
  //   if (action === "export") {
  //     exportProposal();
  //   }
  // };

  // const exportProposal = () => {
  //   const url = `/proposals/${proposal?.id}`;
  //   window.open(url, "_blank");
  // };

  // const submitProposal = async () => {
  //   const res = await updateProposal({
  //     variables: { id: proposal.id, isSubmitted: true },
  //   });
  // };

  // const toggleCheckTo = async (name, newState) => {
  //   let checklist;
  //   const prevCheckList = proposal?.checklist || [];
  //   if (newState) {
  //     checklist = [...prevCheckList, name];
  //   } else {
  //     checklist = [...prevCheckList.filter((item) => item !== name)];
  //   }
  //   await updateProposal({
  //     variables: {
  //       id: proposal?.id,
  //       checklist,
  //     },
  //   });
  // };

  const submitProposal = async () => {
    // await updateStudy({
    //   variables: {
    //     id: study?.id,
    //     input: {
    //       status: status,
    //     },
    //   },
    // });
    // if (status === "IN_REVIEW") {
    //   submitProposal();
    // }
    ("Submitting proposal for review");
    const res = await updateProposal({
      variables: {
        id: proposal?.id,
        input: {
          status: "SUBMITTED_AS_PROPOSAL_FOR_REVIEW",
        },
      },
    });
    if (res?.data?.updateProposalBoard?.id) {
      alert("The proposal was submitted for review");
    }
  };

  return (
    <StyledReviewSection>
      <div>
        <StyledReviewCard className="submit">
          <h2>Ready to receive feedback on your proposal?</h2>
          <p>
            Once you submit your proposal for review, your proposal will become
            available to peer reviews from other participating schools to view
            and review.
          </p>
          <p>
            {proposal?.status === "SUBMITTED_AS_PROPOSAL_FOR_REVIEW" && (
              <strong>
                You have already submitted your proposal for review.
              </strong>
            )}
          </p>
          <div className="buttons">
            {proposal?.status === "SUBMITTED_AS_PROPOSAL_FOR_REVIEW" && (
              <Link href={`/dashboard/review`}>
                <div className="submitBtn view">
                  <img src="/assets/icons/review/brain-and-head-green.svg" />
                  <div>View submission</div>
                </div>
              </Link>
            )}

            {proposal?.status !== "SUBMITTED_AS_PROPOSAL_FOR_REVIEW" && (
              <div
                className="submitBtn active"
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
                <img src="/assets/icons/review/brain-and-head.svg" />
                <div>Submit Proposal</div>
              </div>
            )}
          </div>
        </StyledReviewCard>

        <StyledReviewCard className="reviews">
          <h2>Feedback</h2>
          <p>
            Once you submit your proposal or study, your reviews will appear
            here.
          </p>
          {/* <Feedback query={query} study={proposal?.study} /> */}
        </StyledReviewCard>
      </div>
    </StyledReviewSection>
  );
}
