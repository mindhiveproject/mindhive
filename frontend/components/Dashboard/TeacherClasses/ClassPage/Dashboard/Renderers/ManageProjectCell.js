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

export function ManageProjectCell(props) {
  const { t } = useTranslation("classes");
  const count = props.data?.projects?.length || 0;

  return (
    <Button
      variant="subtle"
      leadingIcon={<DashboardAssetIcon src="/assets/icons/project.svg" />}
      onClick={(event) => {
        event.stopPropagation();
        props.onManageProject?.(props.data);
      }}
      style={COMPACT_BUTTON_STYLE}
    >
      {t("dashboard.manageProjects", { count }, {
        default: "Manage Projects ({{count}})",
      })}
    </Button>
  );
}
