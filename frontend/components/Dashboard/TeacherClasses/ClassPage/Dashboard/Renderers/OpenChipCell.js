import useTranslation from "next-translate/useTranslation";

import Chip from "../../../../../DesignSystem/Chip";
import DashboardAssetIcon from "../DashboardAssetIcon";

export function OpenChipCell(props) {
  const { t } = useTranslation("classes");
  const isStudy = props.statusTarget === "study";
  const isOpen = Boolean(props.value);
  const hasTarget = isStudy
    ? Boolean(props.data?.studyId)
    : Boolean(props.data?.projectId);

  if (!hasTarget) {
    return (
      <span>
        {t("dashboard.none", {}, { default: "None" })}
      </span>
    );
  }

  const label = isStudy
    ? isOpen
      ? t("dashboard.openForParticipation", {}, {
          default: "Open for participation",
        })
      : t("dashboard.notOpenForParticipation", {}, {
          default: "Not open for participation",
        })
    : isOpen
      ? t("dashboard.openForComments", {}, { default: "Open for comments" })
      : t("dashboard.notOpenForComments", {}, {
          default: "Not open for comments",
        });

  return (
    <Chip
      label={label}
      selected={isOpen}
      leading={
        <DashboardAssetIcon
          src={
            isStudy
              ? "/assets/icons/review/participate.svg"
              : "/assets/icons/review/comment.svg"
          }
          size={20}
        />
      }
      onClick={() => props.onManageStatus?.(props.data)}
    />
  );
}
