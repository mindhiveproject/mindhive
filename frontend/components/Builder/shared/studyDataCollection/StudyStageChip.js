import useTranslation from "next-translate/useTranslation";

import Chip from "../../../DesignSystem/Chip";
import { stageLabel } from "./labels";

// Asks the study builder to show Settings → Study status (Builder.js).
export const OPEN_STUDY_STATUS_EVENT = "mh:open-study-status";

export function openStudyStatus() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_STUDY_STATUS_EVENT));
}

/**
 * Where a supervised study stands (Designing, Collecting data · Open/Closed,
 * Data collection finished), for the study builder's header and the
 * student's study lists. Nothing for a self-managed study. Clicking it calls
 * `onClick` (the builder opens Settings → Study status).
 *
 * `state`: the study's data-collection state (useStudyDataCollection), or a
 * `{ stage, open, supervised, locked }` lifecycle (lib/studyLifecycle.js).
 */
export default function StudyStageChip({ state, onClick, className }) {
  const { t } = useTranslation("builder");
  if (!state || !(state.supervised || state.locked)) return null;

  let tone = "neutral";
  let label = stageLabel(t, state.stage);
  if (state.stage === "COLLECTING") {
    tone = state.open ? "success" : "warning";
    label = `${label} · ${
      state.open
        ? t("dataCollection.stageOpen", {}, { default: "Open" })
        : t("dataCollection.stageClosed", {}, { default: "Closed" })
    }`;
  } else if (state.stage === "FINISHED") {
    tone = "info";
  }

  return (
    <Chip
      className={className}
      variant={onClick ? "interactive" : "static"}
      tone={tone}
      label={label}
      truncate={false}
      onClick={onClick}
      title={t("dataCollection.stageChipHint", {}, {
        default:
          "Your class follows this study's data collection. Open Study status to submit it or see its activity.",
      })}
    />
  );
}
