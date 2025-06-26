import { useQuery, useMutation } from "@apollo/client";
import absoluteUrl from "next-absolute-url";
import { UPDATE_STUDY } from "../../../../../../Mutations/Study";
import { PROPOSAL_QUERY } from "../../../../../../Queries/Proposal";
import { CREATE_LOG } from "../../../../../../Mutations/Log";
import useTranslation from "next-translate/useTranslation";

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
  const { t } = useTranslation("builder");
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
      alert(t("submitStudy.submittedForReview", "The proposal was submitted for review"));
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
        alert(t("submitStudy.unlockedForParticipation", "The study was unlocked for participation"));
      } else {
        alert(t("submitStudy.lockedForParticipation", "The study was locked for participation"));
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
        saveBtnName={t("submitStudy.submitFor", { title: cardTypes[proposalCard?.type].title }, `Submit for ${cardTypes[proposalCard?.type].title}`)}
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
              <div className="title">{t("submitStudy.dataCollection", "Data Collection")}</div>
            </div>
            <div className="card">
              <h3>{t("submitStudy.studyUrl", "Study url")}</h3>
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
                  <div className="title">{t("submitStudy.studyWasSubmitted", "The study was submitted")}</div>
                </div>
              </>
            ) : (
              <>
                <div className="title">
                  {t("submitStudy.submitForDataCollection", "Submit your study for data collection")}
                </div>

                <div className="subtitle">
                  {t("submitStudy.submitForFeedbackIntro", "Once you submit your study for feedback:")}
                  <ul>
                    <li>{t("submitStudy.appearInFeedbackCenter", "Your study will appear in the Feedback Center.")}</li>
                  </ul>
                </div>

                {allCardsCompleted ? (
                  <div className="subtitle">
                    {t("submitStudy.readyToSubmit", "The study is ready to be submitted for feedback!")}
                  </div>
                ) : (
                  <div className="subtitle warning">
                    {t("submitStudy.completeAllRequired", "Please complete all required cards before submitting your proposal for feedback.")}
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
