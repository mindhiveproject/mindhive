import { useState } from "react";
import { useRouter } from "next/router";
import absoluteUrl from "next-absolute-url";
import useTranslation from "next-translate/useTranslation";
import { useBoardMilestones } from "../../../../../../../lib/useBoardMilestones";
import { resolveMilestoneFromCard } from "../../../../../../../lib/milestones";

import NavigationSubmitStudy from "./NavigationSubmitStudy";
import { cardTypes } from "../../Builder/Actions/ActionCard";
import { builderHref } from "../../../../../shared/identity";
import Button from "../../../../../../DesignSystem/Button";
import MessageCard from "../../../../../../DesignSystem/MessageCard";
import SubmitStudyDialog from "../../../../../shared/studyDataCollection/SubmitStudyDialog";
import {
  otherPeople,
  useStudyDataCollection,
} from "../../../../../shared/studyDataCollection/useStudyDataCollection";
import DataCollectionHistory from "../../../../../shared/studyDataCollection/DataCollectionHistory";

import { StyledActionPage } from "../../../../../../styles/StyledReview";
import { StyledStudyPreview } from "../../../../../../styles/StyledStudyPage";

// The data-collection card of a project board. Submitting, finishing and
// opening/closing participation go through setStudyDataCollection, which
// updates the study and every board linked to it (another student's board
// included), so the decision is confirmed in SubmitStudyDialog first.
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
  const defaultStep = cardTypes[proposalCard?.type];
  const heading =
    (!defaultStep && milestone?.title) ||
    t("submitStudy.dataCollection", "Data Collection");
  const stepTitle = defaultStep?.title || heading;

  const allCardsCompleted = true;
  const {
    state,
    saving,
    run,
  } = useStudyDataCollection(study?.id, { skip: isPreview || !hasStudy });
  const stage = state?.stage || "DESIGNING";
  const isStudySubmitted = !isPreview && stage !== "DESIGNING";
  const isParticipationLocked = !(state ? state.open : study?.dataCollectionOpenForParticipation);
  const others = otherPeople(state, user?.id);
  const [dialogMode, setDialogMode] = useState(null);

  const confirmDialog = async (acknowledgedProfileIds) => {
    const done = await run(dialogMode, {
      acknowledgedProfileIds,
      confirmed: true,
    });
    if (done) setDialogMode(null);
  };

  const switchFeedbackLock = async () => {
    const updated = await run("SET_PARTICIPATION", {
      open: isParticipationLocked,
    });
    if (updated) {
      if (updated.open) {
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
          saveBtnFunction={() => setDialogMode("SUBMIT")}
          isStudySubmitted={isStudySubmitted}
          canSubmit={hasStudy && !!state?.canEdit && !saving}
          switchFeedbackLock={switchFeedbackLock}
          isParticipationLocked={isParticipationLocked}
          showParticipationToggle={stage === "COLLECTING" && !!state?.canEdit}
        />
      )}
      <SubmitStudyDialog
        open={!!dialogMode}
        mode={dialogMode || "SUBMIT"}
        studyTitle={study?.title}
        state={state}
        userId={user?.id}
        saving={saving}
        onCancel={() => setDialogMode(null)}
        onConfirm={confirmDialog}
      />
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
                  <div className="title MH-Type-Title-Base">
                    {stage === "FINISHED"
                      ? t("submitStudy.dataCollectionFinished", "Data collection is finished")
                      : t("submitStudy.studyWasSubmitted", "The study was submitted")}
                  </div>
                </div>
                <MessageCard
                  variant="warning"
                  message={
                    stage === "FINISHED"
                      ? t("submitStudy.finishedLocked", "Participation is closed and the study stays locked. Only a teacher can resume data collection.")
                      : t("submitStudy.submittedLocked", "The study is locked for everyone who shares it. Only a teacher can reopen it for editing.")
                  }
                />
                {stage === "COLLECTING" && state?.canEdit ? (
                  <div>
                    <Button
                      variant="outline"
                      disabled={saving}
                      onClick={() => setDialogMode("FINISH")}
                    >
                      {t("submitStudy.markFinished", "Mark data collection as finished")}
                    </Button>
                  </div>
                ) : null}
                <DataCollectionHistory history={state?.history} />
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
                    <li>{t("submitStudy.lockedForEveryone", "The study is locked for everyone who shares it. Only a teacher can reopen it.")}</li>
                  </ul>
                </div>

                {others.length ? (
                  <MessageCard
                    variant="information"
                    message={t(
                      "submitStudy.sharedWith",
                      {
                        count: (state?.boards || []).filter((b) => b.milestoneKey).length,
                        people: others.map((p) => p.username).join(", "),
                      },
                      {
                        default:
                          "Shared study ({{count}} boards) with {{people}}. Submitting submits it for everyone: agree on it together first.",
                      }
                    )}
                  />
                ) : null}

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
