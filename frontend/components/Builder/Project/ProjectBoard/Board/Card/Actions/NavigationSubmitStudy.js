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
  saveBtnName,
  saveBtnFunction,
  allCardsCompleted,
  isStudySubmitted,
  switchFeedbackLock,
  isParticipationLocked,
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
        {cardId && !isStudySubmitted && (
          <button
            onClick={async () => {
              if (
                confirm(
                  "Are you sure you want to submit? You will not be able to undo it later."
                )
              ) {
                await saveBtnFunction();
              }
            }}
            className={"saveButton"}
          >
            {saveBtnName}
          </button>
        )}
        {cardId && isStudySubmitted && (
          <div className="iconBtn">
            {!isParticipationLocked && (
              <div className="lockText">Enough participants?</div>
            )}
            <button
              onClick={async () => {
                await switchFeedbackLock();
              }}
              className={"lockButton"}
            >
              {isParticipationLocked
                ? "Unlock for Participation"
                : "Lock Participation"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
