import useTranslation from "next-translate/useTranslation";

import Chip from "../../../../../DesignSystem/Chip";
import DashboardAssetIcon from "../DashboardAssetIcon";
import { STATUS_ICON_SRC } from "../dashboardUtils";

function statusLabel(status, t, isStudy) {
  switch (status) {
    case "IN_PROGRESS":
      return t("dashboard.inProgress", {}, { default: "In progress" });
    case "SUBMITTED":
      return t("dashboard.submitted", {}, { default: "Submitted" });
    case "FINISHED":
      return isStudy
        ? t("dashboard.dataCollectionFinished", {}, {
            default: "Data collection is finished",
          })
        : t("dashboard.reviewFinished", {}, { default: "Review is finished" });
    case "NOT_STARTED":
    default:
      return t("dashboard.notStarted", {}, { default: "Not started" });
  }
}

// One cell per milestone: status, plus the open state and comment count when
// they apply, joined into a single chip label.
export function MilestoneStatusCell(props) {
  const { t } = useTranslation("classes");
  const { milestone } = props;
  const entry = props.data?.milestones?.[milestone?.key];
  const isStudy = milestone?.statusTarget === "study";

  if (!props.data?.projectId || !entry) {
    return <span>{t("dashboard.none", {}, { default: "None" })}</span>;
  }

  const status = entry.status || "NOT_STARTED";
  const parts = [statusLabel(status, t, isStudy)];
  if (entry.isOpen) {
    parts.push(
      isStudy
        ? t("dashboard.openForParticipation", {}, {
            default: "Open for participation",
          })
        : t("dashboard.openForComments", {}, { default: "Open for comments" })
    );
  }
  if (entry.reviewCount > 0) {
    parts.push(
      t("dashboard.commentsCount", { count: entry.reviewCount }, {
        default: "{{count}} comments",
      })
    );
  }

  return (
    <Chip
      label={parts.join(" · ")}
      leading={
        <DashboardAssetIcon
          src={STATUS_ICON_SRC[status] || STATUS_ICON_SRC.NOT_STARTED}
          size={20}
        />
      }
      onClick={() => props.onManageStatus?.(props.data, milestone)}
    />
  );
}
