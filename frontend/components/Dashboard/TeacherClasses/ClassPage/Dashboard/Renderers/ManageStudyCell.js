import useTranslation from "next-translate/useTranslation";

import Button from "../../../../../DesignSystem/Button";
import DashboardAssetIcon from "../DashboardAssetIcon";

const COMPACT_BUTTON_STYLE = {
  height: 32,
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 12,
  paddingRight: 16,
  fontWeight: 500,
};

export function ManageStudyCell(props) {
  const { t } = useTranslation("classes");
  const count = props.data?.studies?.length || 0;

  return (
    <Button
      variant="subtle"
      leadingIcon={<DashboardAssetIcon src="/assets/icons/education.svg" />}
      onClick={(event) => {
        event.stopPropagation();
        props.onManageStudy?.(props.data);
      }}
      style={COMPACT_BUTTON_STYLE}
    >
      {t("dashboard.studyManager.manageStudies", { count }, {
        default: "Manage Studies ({{count}})",
      })}
    </Button>
  );
}
