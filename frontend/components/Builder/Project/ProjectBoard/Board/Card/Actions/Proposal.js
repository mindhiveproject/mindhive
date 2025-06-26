import { useQuery, useMutation } from "@apollo/client";
import ReactHtmlParser from "react-html-parser";
import useTranslation from "next-translate/useTranslation";

import { UPDATE_PROJECT_BOARD } from "../../../../../../Mutations/Proposal";
import { PROPOSAL_QUERY } from "../../../../../../Queries/Proposal";
import { PROPOSAL_REVIEWS_QUERY } from "../../../../../../Queries/Proposal";
import { CREATE_LOG } from "../../../../../../Mutations/Log";

import Navigation from "./Navigation";
import { cardTypes } from "../../Builder/Actions/ActionCard";

import { StyledActionPage } from "../../../../../../styles/StyledReview";
import Feedback from "../../../../../../Dashboard/Review/Feedback/Main";

const submitOptions = {
  ACTION_SUBMIT: {
    event: "PROPOSAL_SUBMITTED_FOR_REVIEW",
    updateInput: {
      submitProposalStatus: "SUBMITTED",
      submitProposalOpenForComments: true,
    },
    name: "expert feedback",
    description:
      "Expert mentors will provide feedback & comments will appear here.",
    status: "SUBMITTED_AS_PROPOSAL",
  },
  ACTION_PEER_FEEDBACK: {
    event: "PROPOSAL_SUBMITTED_FOR_PEER_REVIEW",
    updateInput: {
      peerFeedbackStatus: "SUBMITTED",
      peerFeedbackOpenForComments: true,
    },
    name: "peer feedback",
    description:
      "Your peers will provide feedback & comments will appear here.",
    status: "PEER_REVIEW",
  },
  ACTION_COLLECTING_DATA: {
    event: "STUDY_SUBMITTED_FOR_DATA_COLLECTION",
    updateInput: {
      // should be updated in study
      dataCollectionStatus: "SUBMITTED",
      dataCollectionData: "REAL_DATA",
      dataCollectionOpenForParticipation: true,
    },
    name: "data collection",
    description: "",
    status: "DATA_COLLECTION",
  },
  ACTION_PROJECT_REPORT: {
    event: "PROJECT_SUBMITTED_FOR_REPORT",
    updateInput: {
      projectReportStatus: "SUBMITTED",
      projectReportOpenForComments: true,
    },
    name: "project report",
    description: "",
    status: "PROJECT_REPORT",
  },
};

export default function Proposal({
  query,
  tab,
  user,
  proposalId,
  proposal,
  cardId,
  proposalCard,
}) {
  const { t } = useTranslation("builder");

  // find the current section for preview
  const currentSections = proposal?.sections?.filter((section) =>
    section?.cards.map((card) => card?.type).includes(proposalCard?.type)
  );

  const cards = [...proposal?.sections]
    ?.sort((a, b) => a?.position - b?.position)
    .map((section) =>
      section?.cards.filter(
        (card) =>
          (card?.settings?.includeInReport &&
            currentSections?.map((s) => s?.id).includes(card?.section?.id)) ||
          card?.settings?.includeInReviewSteps?.includes(proposalCard?.type)
      )
    )
    .flat();

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
  const isProposalSubmitted =
    proposal[cardTypes[proposalCard?.type].proposalSubmitStatusQuery] ===
    "SUBMITTED";
  const isFeedbackLocked =
    !proposal[cardTypes[proposalCard?.type].proposalOpenForCommentsQuery];

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

  const [createLog] = useMutation(CREATE_LOG);

  const submitProposal = async () => {
    const res = await updateProposal({
      variables: {
        id: proposal?.id,
        input: submitOptions[proposalCard.type]?.updateInput,
      },
    });
    await createLog({
      variables: {
        input: {
          event: submitOptions[proposalCard.type]?.event,
          user: {
            connect: { id: user?.id },
          },
          proposal: {
            connect: { id: proposalId },
          },
          class: {
            connect: { id: proposal?.usedInClass?.id },
          },
          content: {
            proposalSnapshot: cards,
          },
        },
      },
    });
    if (res?.data?.updateProposalBoard?.id) {
      alert(t("proposalAction.submittedForReview", "The proposal was submitted for review"));
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
        alert(t("proposalAction.unlockedForFeedback", "The proposal was unlocked for feedback"));
      } else {
        alert(t("proposalAction.lockedForFeedback", "The proposal was locked for feedback"));
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
        saveBtnName={t("proposalAction.submitFor", { title: cardTypes[proposalCard?.type].title }, `Submit for ${cardTypes[proposalCard?.type].title}`)}
        saveBtnFunction={() => {
          submitProposal();
        }}
        allCardsCompleted={allCardsCompleted}
        isProposalSubmitted={isProposalSubmitted}
        switchFeedbackLock={switchFeedbackLock}
        isFeedbackLocked={isFeedbackLocked}
      />
      <StyledActionPage>
        <div className="board">
          <div className="proposal">
            <div className="iconTitle">
              <img src="/assets/icons/project.svg" />
              <div className="title">
                {cardTypes[proposalCard?.type].previewTitle}
              </div>
            </div>

            <div className="subtitle">
              {t("proposalAction.feedbackCenterPreview", "This is how your proposal will appear in the Feedback Center")}
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
                  <div className="cardText">
                    {ReactHtmlParser(card?.content)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="instructions">
            {isProposalSubmitted ? (
              <>
                <div className="iconTitle">
                  <img src="/assets/icons/eye.svg" />
                  <div className="title">{t("proposalAction.comments", "Comments")}</div>
                </div>

                <div className="reviews">
                  <Feedback
                    user={user}
                    projectId={project?.id}
                    status={submitOptions[proposalCard.type]?.status}
                    reviews={
                      project?.reviews?.filter(
                        (review) =>
                          review.stage ===
                          cardTypes[proposalCard?.type].reviewStage
                      ) || []
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div className="title">
                  {t("proposalAction.submitForTitle", {
                    name: submitOptions[proposalCard.type]?.name,
                  }, `Submit your proposal for ${submitOptions[proposalCard.type]?.name}`)}
                </div>

                <div className="subtitle">
                  {t("proposalAction.submitForFeedbackIntro", "Once you submit your proposal for feedback:")}
                  <ul>
                    <li>{t("proposalAction.appearInFeedbackCenter", "Your proposal will appear in the Feedback Center.")}</li>
                    {submitOptions[proposalCard.type]?.description && (
                      <li>{submitOptions[proposalCard.type]?.description}</li>
                    )}
                    <li>{t("proposalAction.cardsLocked", "The cards that are included in the Proposal will be locked. Your teacher can unlock them.")}</li>
                  </ul>
                </div>

                <div className="subtitle">
                  {t("proposalAction.completeAllBeforeSubmit", "Please make sure all cards listed below are marked as “completed” before you submit.")}
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
                            {card?.settings?.status || t("proposalAction.notStarted", "Not started")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {allCardsCompleted ? (
                  <div className="subtitle">
                    {t("proposalAction.readyToSubmit", "The proposal is ready to be submitted for feedback!")}
                  </div>
                ) : (
                  <div className="subtitle warning">
                    {t("proposalAction.completeAllRequired", "Please complete all required cards before submitting your proposal for feedback.")}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </StyledActionPage>
    </>
  );
}
