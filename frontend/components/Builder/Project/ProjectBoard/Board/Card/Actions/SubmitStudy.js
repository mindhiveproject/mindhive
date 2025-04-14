import { useQuery, useMutation } from "@apollo/client";
import absoluteUrl from "next-absolute-url";
import { UPDATE_STUDY } from "../../../../../../Mutations/Study";
import { PROPOSAL_QUERY } from "../../../../../../Queries/Proposal";
import { CREATE_LOG } from "../../../../../../Mutations/Log";

import NavigationSubmitStudy from "./NavigationSubmitStudy";
import { cardTypes } from "../../Builder/Actions/ActionCard";

import { StyledActionPage } from "../../../../../../styles/StyledReview";
import { StyledStudyPreview } from "../../../../../../styles/StyledStudyPage";

export default function Proposal({
  query,
  tab,
  user,
  proposalId,
  proposal,
  cardId,
  proposalCard,
}) {
  const { origin } = absoluteUrl();
  const study = proposal?.study || {};

  const allCardsCompleted = true;
  const isStudySubmitted = study?.dataCollectionStatus === "SUBMITTED";
  const isParticipationLocked = !study?.dataCollectionOpenForParticipation;
  const [updateStudy, { loading }] = useMutation(UPDATE_STUDY, {
    refetchQueries: [
      {
        query: PROPOSAL_QUERY,
        variables: { id: proposal?.id },
      },
    ],
  });

  const [createLog] = useMutation(CREATE_LOG);

  const submitStudy = async () => {
    const res = await updateStudy({
      variables: {
        id: study?.id,
        input: {
          status: "COLLECTING_DATA",
          dataCollectionStatus: "SUBMITTED",
          dataCollectionOpenForParticipation: true,
        },
      },
    });
    await createLog({
      variables: {
        input: {
          event: "STUDY_SUBMITTED_FOR_DATA_COLLECTION",
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
            proposalSnapshot: "No cards submitted",
          },
        },
      },
    });
    if (res?.data?.updateProposalBoard?.id) {
      alert("The proposal was submitted for review");
    }
  };

  const switchFeedbackLock = async () => {
    const res = await updateStudy({
      variables: {
        id: study?.id,
        input: {
          dataCollectionOpenForParticipation: isParticipationLocked,
        },
      },
    });
    if (res?.data?.updateStudy?.id) {
      if (isParticipationLocked) {
        alert("The study was unlocked for participation");
      } else {
        alert("The study was locked for participation");
      }
    }
  };

  return (
    <>
      <NavigationSubmitStudy
        query={query}
        user={user}
        tab={tab}
        proposalId={proposalId}
        cardId={cardId}
        saveBtnName={`Submit for ${cardTypes[proposalCard?.type].title}`}
        saveBtnFunction={() => {
          submitStudy();
        }}
        isStudySubmitted={isStudySubmitted}
        switchFeedbackLock={switchFeedbackLock}
        isParticipationLocked={isParticipationLocked}
      />
      <StyledActionPage>
        <div className="board">
          <div className="proposal">
            <div className="iconTitle">
              <img src="/assets/icons/project.svg" />
              <div className="title">Data Collection</div>
            </div>
            <div className="card">
              <h3>Study url</h3>
              <label htmlFor="slug">
                <a href={`${origin}/studies/${study.slug}`} target="_blank">
                  <p className="accessLink">
                    {origin}
                    /studies/
                    {study.slug}
                  </p>
                </a>
              </label>
            </div>
          </div>

          <div className="instructions">
            {isStudySubmitted ? (
              <>
                <div className="iconTitle">
                  <img src="/assets/icons/eye.svg" />
                  <div className="title">The study was submitted</div>
                </div>
              </>
            ) : (
              <>
                <div className="title">
                  Submit your study for data collection
                </div>

                <div className="subtitle">
                  Once you submit your study for feedback:
                  <ul>
                    <li>Your study will appear in the Feedback Center.</li>
                  </ul>
                </div>

                {allCardsCompleted ? (
                  <div className="subtitle">
                    The study is ready to be submitted for feedback!
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
        </div>
      </StyledActionPage>
    </>
  );
}
