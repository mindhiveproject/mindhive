import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";

import { PROPOSAL_QUERY } from "../../../../../../Queries/Proposal";

export default function Navigation({
  query,
  tab,
  user,
  proposalId,
  cardId,
  saveBtnFunction,
  allCardsCompleted,
  isProposalSubmitted,
  switchFeedbackLock,
  isFeedbackLocked,
}) {
  const { data, error, loading } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
  });
  const study = data?.proposalBoard || {
    title: "",
  };

  return (
    <div className="cardNavigation">
      <div className="left">
        <div className="icon">
          <Link
            href={{
              pathname: `/builder/projects/`,
              query: {
                selector: proposalId,
              },
            }}
          >
            <div className="selector">
              <img src="/assets/icons/back.svg" alt="back" />
            </div>
          </Link>
        </div>
      </div>
      <div className="middle">
        <span className="studyTitle">{study?.title}</span>
      </div>
      <div className="right">
        {cardId && !isProposalSubmitted && (
          <button
            onClick={async () => {
              if (
                confirm(
                  "Are you sure you want to submit this proposal? You will not be able to undo it later."
                )
              ) {
                await saveBtnFunction();
              }
            }}
            className={allCardsCompleted ? "saveButton" : "saveButton disabled"}
            disabled={!allCardsCompleted}
          >
            Submit for Proposal Feedback
          </button>
        )}
        {cardId && isProposalSubmitted && (
          <div className="iconBtn">
            {!isFeedbackLocked && (
              <div className="lockText">
                Enough comments? Let reviewers know
              </div>
            )}
            <button
              onClick={async () => {
                await switchFeedbackLock();
              }}
              className={"lockButton"}
              disabled={!allCardsCompleted}
            >
              {isFeedbackLocked ? "Unlock for Feedback" : "Lock Feedback"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
