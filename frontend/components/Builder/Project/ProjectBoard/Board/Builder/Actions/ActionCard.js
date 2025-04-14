import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";

import { PROPOSAL_REVIEWS_QUERY } from "../../../../../../Queries/Proposal";

import { StyledActionCard } from "../../../../../../styles/StyledProposal";

export const cardTypes = {
  ACTION_SUBMIT: {
    title: "Proposal Feedback",
    reviewStage: "SUBMITTED_AS_PROPOSAL",
    proposalSubmitStatusQuery: "submitProposalStatus",
    proposalOpenForCommentsQuery: "submitProposalOpenForComments",
    previewTitle: "Project Proposal",
  },
  ACTION_PEER_FEEDBACK: {
    title: "Peer Feedback",
    reviewStage: "PEER_REVIEW",
    proposalSubmitStatusQuery: "peerFeedbackStatus",
    proposalOpenForCommentsQuery: "peerFeedbackOpenForComments",
    previewTitle: "Peer Feedback",
  },
  ACTION_COLLECTING_DATA: {
    title: "Data Collection",
    reviewStage: "DATA_COLLECTION",
    proposalSubmitStatusQuery: "",
    proposalOpenForCommentsQuery: "",
    previewTitle: "Data Collection",
  },
  ACTION_PROJECT_REPORT: {
    title: "Project Report",
    reviewStage: "PROJECT_REPORT",
    proposalSubmitStatusQuery: "projectReportStatus",
    proposalOpenForCommentsQuery: "projectReportOpenForComments",
    previewTitle: "Project Report",
  },
};

export default function ActionCard({
  card,
  proposalBuildMode,
  adminMode,
  openCard,
  onDeleteCard,
  settings,
  boardId,
  submitStatuses,
}) {
  const router = useRouter();
  const isSubmitted = submitStatuses[card?.type] === "SUBMITTED";

  const { data } = useQuery(PROPOSAL_REVIEWS_QUERY, {
    variables: {
      id: boardId,
    },
  });

  const project = data?.proposalBoard || { sections: [] };
  const comments = project?.reviews?.filter(
    (review) => review.stage === cardTypes[card?.type].reviewStage
  );

  return (
    <StyledActionCard
      onClick={() => {
        router.push({
          pathname: `/builder/projects`,
          query: {
            selector: boardId,
            card: card?.id,
          },
        });
      }}
      type={card?.type}
      isSubmitted={isSubmitted}
    >
      <div className="card-drag-handle">
        <div className="card-information">
          <div className="card-left-side">
            {isSubmitted ? (
              <img src="/assets/icons/eye.svg" />
            ) : (
              <img src="/assets/icons/upload.svg" />
            )}
          </div>
          <div>
            <div className="card-title">
              <div>Submit for {cardTypes[card?.type].title}</div>
              {isSubmitted ? (
                <>
                  {card?.type !== "ACTION_COLLECTING_DATA" && (
                    <p>
                      View {comments?.length > 0 ? comments.length + " " : ""}
                      comments
                    </p>
                  )}
                </>
              ) : (
                <p>Click to submit for {cardTypes[card?.type].title}</p>
              )}
            </div>
          </div>
          <div className="card-right-side">
            {isSubmitted ? (
              <img src="/assets/icons/status/publicTemplatesubmitted.svg" />
            ) : (
              <img src="/assets/icons/status/publicTemplate.svg" />
            )}
          </div>
        </div>
      </div>
      {settings?.allowAddingCards && (
        <div className="deleteCardBtn">
          <img
            src="/assets/icons/proposal/delete.svg"
            onClick={(e) => {
              e.stopPropagation();
              if (
                confirm(
                  "Are you sure you want to delete this card? This action cannot be undone."
                )
              ) {
                onDeleteCard(card.id);
              }
            }}
          />
        </div>
      )}
    </StyledActionCard>
  );
}
