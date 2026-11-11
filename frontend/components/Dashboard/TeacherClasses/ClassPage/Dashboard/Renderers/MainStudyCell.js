import useTranslation from "next-translate/useTranslation";

import Chip from "../../../../../DesignSystem/Chip";

// Read-only: whether the student's main project has a study linked. A linked
// study opens the class Studies tab, searched to that study.
export function MainStudyCell(props) {
  const { t } = useTranslation("classes");
  const { studyId, studyTitle, projectId } = props.data || {};

  if (!projectId) {
    return (
      <Chip
        variant="static"
        tone="neutral"
        label={t("dashboard.mainStudyChip.noProject", {}, {
          default: "No project",
        })}
      />
    );
  }

  if (!studyId) {
    return (
      <Chip
        dashed
        label={t("dashboard.mainStudyChip.noStudy", {}, {
          default: "No study",
        })}
        title={t("dashboard.mainStudyChip.noStudyHint", {}, {
          default: "The main project has no study linked yet.",
        })}
      />
    );
  }

  const title =
    studyTitle ||
    t("dashboard.mainStudyChip.untitled", {}, { default: "Untitled study" });

  return (
    <Chip
      label={title}
      labelLines={1}
      title={t("dashboard.mainStudyChip.openInStudies", { title }, {
        default: "Show “{{title}}” in the Studies tab",
      })}
      onClick={(event) => {
        event?.stopPropagation?.();
        props.onOpenStudy?.(props.data);
      }}
    />
  );
}
