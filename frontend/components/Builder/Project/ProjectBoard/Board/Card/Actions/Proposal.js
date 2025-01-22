import { useQuery, useMutation } from "@apollo/client";
import Link from "next/link";
import ReactHtmlParser from "react-html-parser";

import { UPDATE_PROJECT_BOARD } from "../../../../../../Mutations/Proposal";
import { PROPOSAL_QUERY } from "../../../../../../Queries/Proposal";
import { PROPOSAL_REVIEWS_QUERY } from "../../../../../../Queries/Proposal";

import Navigation from "./Navigation";
import Comment from "./Comment";

import { StyledActionPage } from "../../../../../../styles/StyledReview";

export default function Proposal({
  query,
  tab,
  user,
  proposalId,
  proposal,
  cardId,
  proposalCard,
}) {
  // find the current section for preview
  const currentSections = proposal?.sections?.filter((section) =>
    section?.cards.map((card) => card?.id).includes(proposalCard?.id)
  );
  let currentSection;
  if (currentSections && currentSections.length) {
    currentSection = currentSections[0];
  }

  const cards = currentSection?.cards.filter(
    (card) => card?.settings?.includeInReport
  );

  const statusesDict = {
    Completed: "completed",
    "In progress": "inProgress",
    "Help needed": "helpNeeded",
    Comments: "comments",
    "Not started": "notStarted",
  };

  const allCardsCompleted =
    cards?.filter((card) => card?.settings?.status !== "Completed").length ===
    0;
  const isProposalSubmitted = proposal?.submitProposalStatus === "SUBMITTED";
  const isFeedbackLocked = !proposal?.submitProposalOpenForComments;

  const { data } = useQuery(PROPOSAL_REVIEWS_QUERY, {
    variables: {
      id: proposal?.id,
    },
  });

  const project = data?.proposalBoard || { sections: [] };

  const [updateProposal, { loading }] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: [
      {
        query: PROPOSAL_QUERY,
        variables: { id: proposal?.id },
      },
    ],
  });

  const submitProposal = async () => {
    const res = await updateProposal({
      variables: {
        id: proposal?.id,
        input: {
          submitProposalStatus: "SUBMITTED",
          submitProposalOpenForComments: true,
        },
      },
    });
    if (res?.data?.updateProposalBoard?.id) {
      alert("The proposal was submitted for review");
    }
  };

  const switchFeedbackLock = async () => {
    const res = await updateProposal({
      variables: {
        id: proposal?.id,
        input: {
          submitProposalOpenForComments: isFeedbackLocked,
        },
      },
    });
    if (res?.data?.updateProposalBoard?.id) {
      if (isFeedbackLocked) {
        alert("The proposal was unlocked for feedback");
      } else {
        alert("The proposal was locked for feedback");
      }
    }
  };

  return (
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        proposalId={proposalId}
        cardId={cardId}
        saveBtnFunction={() => {
          submitProposal();
        }}
        allCardsCompleted={allCardsCompleted}
        isProposalSubmitted={isProposalSubmitted}
        switchFeedbackLock={switchFeedbackLock}
        isFeedbackLocked={isFeedbackLocked}
      />
      <StyledActionPage>
        <div className="proposal">
          <div className="iconTitle">
            <img src="/assets/icons/project.svg" />
            <div className="title">Project Proposal</div>
          </div>

          <div className="subtitle">
            This is how your proposal will appear in the Feedback Center
          </div>
          <div className="cards">
            {cards?.map((card) => (
              <div className="card">
                <div className="cardTitleIcon">
                  <div className="cardTitle">{card?.title}</div>
                  <img
                    src={`/assets/icons/status/${
                      statusesDict[card?.settings?.status] || "notStarted"
                    }.svg`}
                  />
                </div>
                <div className="cardText">{ReactHtmlParser(card?.content)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="instructions">
          {isProposalSubmitted ? (
            <>
              <div className="iconTitle">
                <img src="/assets/icons/eye.svg" />
                <div className="title">Comments</div>
              </div>

              <div>
                {project?.reviews &&
                project?.reviews.filter(
                  (review) => review.stage === "SUBMITTED_AS_PROPOSAL"
                ).length ? (
                  <div className="reviewsCards">
                    {project?.reviews
                      .filter(
                        (review) => review.stage === "SUBMITTED_AS_PROPOSAL"
                      )
                      .sort((a, b) => {
                        return b?.upvotedBy?.length - a?.upvotedBy?.length;
                      })
                      .map((review, num) => (
                        <Comment key={num} number={num + 1} review={review} />
                      ))}
                  </div>
                ) : (
                  <div className="reviewsPlaceholder"></div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="title">
                Submit your proposal for expert feedback
              </div>

              <div className="subtitle">
                Once you submit your proposal for feedback:
                <ul>
                  <li>Your proposal will appear in the Feedback Center.</li>
                  <li>
                    Expert mentors will provide feedback & comments will appear
                    here.
                  </li>
                  <li>
                    The cards that are included in the Proposal will be locked.
                    Your teacher can unlock them.
                  </li>
                </ul>
              </div>

              <div className="subtitle">
                Please make sure all cards listed below are marked as
                “completed” before you submit.
              </div>

              <div className="lists">
                {cards?.map((card) => (
                  <div className="list">
                    <div className="listIconTitle">
                      <img
                        src={`/assets/icons/status/${
                          statusesDict[card?.settings?.status] || "notStarted"
                        }.svg`}
                      />
                      <div>
                        <div className="listTitle">{card?.title}</div>
                        <div className="listSubtitle">
                          {card?.settings?.status || "Not started"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {allCardsCompleted ? (
                <div className="subtitle">
                  The proposal is ready to be submitted for feedback!
                </div>
              ) : (
                <div className="subtitle warning">
                  Please complete all required cards before submitting your
                  proposal for feedback.
                </div>
              )}
            </>
          )}
        </div>
      </StyledActionPage>
    </>
  );
}

{
  /* <div className="reviews">
              <h2>Feedback</h2>
              <p>
                Once you submit your proposal or study, your reviews will appear
                here.
              </p>

              <div>
                {project?.reviews &&
                project?.reviews.filter(
                  (review) => review.stage === "SUBMITTED_AS_PROPOSAL"
                ).length ? (
                  <div className="reviewsCards">
                    {project?.reviews
                      .filter(
                        (review) => review.stage === "SUBMITTED_AS_PROPOSAL"
                      )
                      .sort((a, b) => {
                        return b?.upvotedBy?.length - a?.upvotedBy?.length;
                      })
                      .map((review, num) => (
                        <Comment key={num} number={num + 1} review={review} />
                      ))}
                  </div>
                ) : (
                  <div className="reviewsPlaceholder">
                    <p>
                      <strong>You don’t have any reviews yet</strong>
                    </p>
                    <p>Reviews will appear here once you submit</p>
                  </div>
                )}
              </div>
            </div> */
}

{
  /* <div className="submit">
            <h2>Ready to receive feedback on your proposal?</h2>
            <p>
              Once you submit your proposal for review, your proposal will
              become available to peer reviews from other participating schools
              to view and review.
            </p>
            <p>
              {proposal?.submitProposalStatus === "SUBMITTED" && (
                <strong>
                  You have already submitted your proposal for review.
                </strong>
              )}
            </p>
            <div className="buttons">
              {proposal?.submitProposalStatus === "SUBMITTED" && (
                <Link href={`/dashboard/review`}>
                  <div className="submitBtn view">
                    <img src="/assets/icons/review/brain-and-head-green.svg" />
                    <div>View submission</div>
                  </div>
                </Link>
              )}

              {proposal?.submitProposalStatus !== "SUBMITTED" && (
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
          </div> */
}
