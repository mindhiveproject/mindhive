import useTranslation from "next-translate/useTranslation";

import Button from "../../../../../DesignSystem/Button";
import { OpenInNewIcon } from "../../../../../DesignSystem/Icons";

// Long titles ellipsise inside the cell instead of spilling into the next column.
const FIT_CELL_STYLE = { maxWidth: "100%", minWidth: 0, flexShrink: 1 };
const LABEL_STYLE = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export function MainProjectCell(props) {
  const { t } = useTranslation("classes");
  const projectId = props.data?.projectId;

  if (!projectId) {
    return <span>{t("dashboard.none", {}, { default: "None" })}</span>;
  }

  const title =
    props.value ||
    t("dashboard.untitledProject", {}, { default: "Untitled project" });

  return (
    <Button
      variant="subtle"
      leadingIcon={<OpenInNewIcon />}
      title={title}
      style={FIT_CELL_STYLE}
      onClick={(event) => {
        event.stopPropagation();
        window.open(`/builder/projects?selector=${projectId}`, "_blank");
      }}
    >
      <span style={LABEL_STYLE}>{title}</span>
    </Button>
  );
}
