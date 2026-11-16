import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import { PROPOSAL_QUERY } from "../../../../../../Queries/Proposal";
import Button from "../../../../../../DesignSystem/Button";

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
  canSubmit = true,
  switchFeedbackLock,
  isParticipationLocked,
  // Participation can be toggled while the study collects data.
  showParticipationToggle = isStudySubmitted,
}) {
  const { t } = useTranslation("builder");
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
              <img src="/assets/icons/back.svg" alt={t("navigation.back", "back")} />
            </div>
          </Link>
        </div>
      </div>
      <div className="middle">
        <span className="studyTitle">{study?.title}</span>
      </div>
      <div className="right">
        {cardId && !isStudySubmitted && (
          <Button
            variant="filled"
            disabled={!canSubmit}
            onClick={async () => {
              if (!canSubmit) return;
              // saveBtnFunction opens the shared submit dialog
              // (Builder/shared/studyDataCollection/SubmitStudyDialog).
              await saveBtnFunction();
            }}
          >
            {saveBtnName}
          </Button>
        )}
        {cardId && showParticipationToggle && (
          <div className="iconBtn">
            {!isParticipationLocked && (
              <div className="lockText">{t("navigation.enoughParticipants", "Enough participants?")}</div>
            )}
            <button
              onClick={async () => {
                await switchFeedbackLock();
              }}
              className={"lockButton"}
            >
              {isParticipationLocked
                ? t("navigation.unlockParticipation", "Unlock for Participation")
                : t("navigation.lockParticipation", "Lock Participation")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
