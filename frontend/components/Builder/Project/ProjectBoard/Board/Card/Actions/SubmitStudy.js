import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import absoluteUrl from "next-absolute-url";
import { UPDATE_STUDY } from "../../../../../../Mutations/Study";
import { UPDATE_PROJECT_BOARD } from "../../../../../../Mutations/Proposal";
import { PROPOSAL_QUERY } from "../../../../../../Queries/Proposal";
import { CREATE_LOG } from "../../../../../../Mutations/Log";
import useTranslation from "next-translate/useTranslation";
import { buildDualWriteUpdate } from "../../../../../../../lib/milestoneStatus";
import { useBoardMilestones } from "../../../../../../../lib/useBoardMilestones";
import { resolveMilestoneFromCard } from "../../../../../../../lib/milestones";

import NavigationSubmitStudy from "./NavigationSubmitStudy";
import { cardTypes } from "../../Builder/Actions/ActionCard";
import { builderHref } from "../../../../../shared/identity";
import Button from "../../../../../../DesignSystem/Button";

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
  // Teacher preview from the template editor: render the student page
  // read-only, without the student nav bar.
  isPreview = false,
}) {
  const { t } = useTranslation("builder");
  const { origin } = absoluteUrl();
  const router = useRouter();
  const study = proposal?.study || {};
  // A board may reach data collection before any study is linked to it:
  // there is then no URL to share and nothing to submit.
  const hasStudy = !!study?.id;

  const { milestones } = useBoardMilestones(proposal?.id || proposalId);
  const milestone = resolveMilestoneFromCard(proposalCard, milestones);
  // Write through the milestone (board milestoneStatus + linked study) so the
  // teacher dashboard sees the change — custom milestones have no legacy
  // study column to fall back on.
  const writesThroughMilestone =
    !!milestone?.key && milestone?.statusTarget === "study";
  const defaultStep = cardTypes[proposalCard?.type];
  const heading =
    (!defaultStep && milestone?.title) ||
    t("submitStudy.dataCollection", "Data Collection");
  const stepTitle = defaultStep?.title || heading;

  const allCardsCompleted = true;
  const isStudySubmitted =
    !isPreview && study?.dataCollectionStatus === "SUBMITTED";
  const isParticipationLocked = !study?.dataCollectionOpenForParticipation;
  const [updateStudy, { loading }] = useMutation(UPDATE_STUDY, {
    refetchQueries: [
      {
        query: PROPOSAL_QUERY,
        variables: { id: proposal?.id },
      },
    ],
  });

  const [updateProposal] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: [
      {
        query: PROPOSAL_QUERY,
        variables: { id: proposal?.id },
      },
    ],
  });

  const [createLog] = useMutation(CREATE_LOG);

  // Returns true once the write lands.
  const writeDataCollectionStatus = async ({ status, openForParticipation }) => {
    if (writesThroughMilestone) {
      const input = buildDualWriteUpdate(
        milestone,
        { status, openForParticipation },
        proposal?.milestoneStatus
      );
      if (status === "SUBMITTED") {
        input.study.update.status = "COLLECTING_DATA";
      }
      const res = await updateProposal({
        variables: { id: proposal?.id, input },
      });
      return !!res?.data?.updateProposalBoard?.id;
    }
    const res = await updateStudy({
      variables: {
        id: study?.id,
        input: {
          ...(status === "SUBMITTED" ? { status: "COLLECTING_DATA" } : {}),
          dataCollectionStatus: status,
          dataCollectionOpenForParticipation: openForParticipation,
        },
      },
    });
    return !!res?.data?.updateStudy?.id;
  };

  const submitStudy = async () => {
    if (!hasStudy) return;
    const submitted = await writeDataCollectionStatus({
      status: "SUBMITTED",
      openForParticipation: true,
    });
    await createLog({
      variables: {
        input: {
          event:
            milestone?.logEventName || "STUDY_SUBMITTED_FOR_DATA_COLLECTION",
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
    if (submitted) {
      alert(t("submitStudy.submittedForReview", "The proposal was submitted for review"));
    }
  };

  const switchFeedbackLock = async () => {
    const updated = await writeDataCollectionStatus({
      status: study?.dataCollectionStatus || "SUBMITTED",
      openForParticipation: isParticipationLocked,
    });
    if (updated) {
      if (isParticipationLocked) {
        alert(t("submitStudy.unlockedForParticipation", "The study was unlocked for participation"));
      } else {
        alert(t("submitStudy.lockedForParticipation", "The study was locked for participation"));
      }
    }
  };

  return (
    <>
      {isPreview ? null : (
        <NavigationSubmitStudy
          query={query}
          user={user}
          tab={tab}
          proposalId={proposalId}
          cardId={cardId}
          saveBtnName={t("submitStudy.submitFor", { title: stepTitle }, `Submit for ${stepTitle}`)}
          saveBtnFunction={() => {
            submitStudy();
          }}
          isStudySubmitted={isStudySubmitted}
          canSubmit={hasStudy}
          switchFeedbackLock={switchFeedbackLock}
          isParticipationLocked={isParticipationLocked}
        />
      )}
      <StyledActionPage>
        <div className="board">
          <div className="proposal">
            <div className="iconTitle">
              <img src="/assets/icons/project.svg" />
              <div className="title MH-Type-Title-Base">{heading}</div>
            </div>
            <div className="card">
              <h3>{t("submitStudy.studyUrl", "Study url")}</h3>
              {hasStudy ? (
                <label htmlFor="slug">
                  <a href={`${origin}/studies/${study.slug}`} target="_blank">
                    <p className="accessLink">
                      {origin}
                      /studies/
                      {study.slug}
                    </p>
                  </a>
                </label>
              ) : (
                <p className="MH-Type-Body-Base">
                  {t("submitStudy.noStudyYet", "Your project doesn't have a study yet.")}
                </p>
              )}
            </div>
          </div>

          <div className="instructions">
            {isStudySubmitted ? (
              <>
                <div className="iconTitle">
                  <img src="/assets/icons/eye.svg" />
                  <div className="title MH-Type-Title-Base">{t("submitStudy.studyWasSubmitted", "The study was submitted")}</div>
                </div>
              </>
            ) : (
              <>
                <div className="title MH-Type-Title-Base">
                  {t("submitStudy.submitForDataCollection", "Submit your study for data collection")}
                </div>

                <div className="subtitle MH-Type-Body-Base">
                  {t("submitStudy.submitForFeedbackIntro", "Once you submit your study for feedback:")}
                  <ul>
                    <li>{t("submitStudy.appearInFeedbackCenter", "Your study will appear in the Feedback Center.")}</li>
                  </ul>
                </div>

                {!hasStudy && (
                  <>
                    <div className="subtitle warning MH-Type-Body-Base">
                      {t("submitStudy.createStudyFirst", "Create your study before submitting it for data collection.")}
                    </div>
                    {!isPreview && (
                      <div>
                        <Button
                          variant="filled"
                          onClick={() =>
                            router.push(
                              builderHref({
                                area: query?.area || "projects",
                                selector: proposal?.id || proposalId,
                                tab: "builder",
                              })
                            )
                          }
                        >
                          {t("submitStudy.goToStudyBuilder", "Go to Study builder")}
                        </Button>
                      </div>
                    )}
                  </>
                )}
                {hasStudy && (allCardsCompleted ? (
                  <div className="subtitle MH-Type-Body-Base">
                    {t("submitStudy.readyToSubmit", "The study is ready to be submitted for feedback!")}
                  </div>
                ) : (
                  <div className="subtitle warning MH-Type-Body-Base">
                    {t("submitStudy.completeAllRequired", "Please complete all required cards before submitting your proposal for feedback.")}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </StyledActionPage>
    </>
  );
}
