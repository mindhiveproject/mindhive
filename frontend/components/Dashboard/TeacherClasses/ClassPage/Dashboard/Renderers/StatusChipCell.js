import useTranslation from "next-translate/useTranslation";

import Chip from "../../../../../DesignSystem/Chip";
import DashboardAssetIcon from "../DashboardAssetIcon";
import { STATUS_ICON_SRC } from "../dashboardUtils";

function statusLabel(status, t, props) {
  switch (status) {
    case "IN_PROGRESS":
      return t("dashboard.inProgress", {}, { default: "In progress" });
    case "SUBMITTED":
      return t("dashboard.submitted", {}, { default: "Submitted" });
    case "FINISHED":
      return props?.statusTarget === "study"
        ? t("dashboard.dataCollectionFinished", {}, {
            default: "Data collection is finished",
          })
        : t("dashboard.reviewFinished", {}, { default: "Review is finished" });
    case "NOT_STARTED":
    default:
      return t("dashboard.notStarted", {}, { default: "Not started" });
  }
}

export function StatusChipCell(props) {
  const { t } = useTranslation("classes");
  const status = props.value || "NOT_STARTED";
  const hasProject = Boolean(props.data?.projectId);

  if (!hasProject) {
    return (
      <span>
        {t("dashboard.none", {}, { default: "None" })}
      </span>
    );
  }

  return (
    <Chip
      label={statusLabel(status, t, props)}
      leading={
        <DashboardAssetIcon
          src={STATUS_ICON_SRC[status] || STATUS_ICON_SRC.NOT_STARTED}
          size={20}
        />
      }
      onClick={() => props.onManageStatus?.(props.data)}
    />
  );
}
