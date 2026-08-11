import useTranslation from "next-translate/useTranslation";

import Chip from "../../../DesignSystem/Chip";
import { NavbarItem } from "../../../DesignSystem/Navbar";
import { formTabKey } from "../../../../lib/opportunityEditorTabs";
import { isProposalFormAnswerComplete } from "../../../../lib/opportunityProposalData";

const STATUS_CHIP_STYLE = {
  height: "auto",
  minHeight: 24,
  paddingLeft: 8,
  paddingRight: 8,
  paddingTop: 2,
  paddingBottom: 2,
  fontSize: 12,
  lineHeight: "16px",
  flexShrink: 0,
  pointerEvents: "none",
  whiteSpace: "nowrap",
  overflow: "visible",
};

const STATUS_COMPLETE_STYLE = {
  ...STATUS_CHIP_STYLE,
  background: "#e3f4ec",
  backgroundColor: "#e3f4ec",
  border: "1px solid #b8dcc8",
  color: "#1d6b3a",
};

const STATUS_INCOMPLETE_STYLE = {
  ...STATUS_CHIP_STYLE,
  background: "#fdf6e8",
  backgroundColor: "#fdf6e8",
  border: "1px solid #e8d4a8",
  color: "#8a6d3b",
};

function resolveStatusLabel(translated, fallback) {
  const value = typeof translated === "string" ? translated.trim() : "";
  // next-translate returns "" for empty locale values and skips `default`.
  if (!value || value.includes("opportunityEditor.tabs.")) {
    return fallback;
  }
  return value;
}

function FormStatusTag({ kind, t }) {
  let label;
  let style;
  let selected = false;

  if (kind === "intake") {
    // Distinct label, same completed visual as follow-up "Complete".
    label = resolveStatusLabel(
      t("opportunityEditor.tabs.originalIntake", {}, {
        default: "Original intake",
      }),
      "Original intake",
    );
    style = STATUS_COMPLETE_STYLE;
    selected = true;
  } else if (kind === "complete") {
    label = resolveStatusLabel(
      t("opportunityEditor.tabs.complete", {}, { default: "Complete" }),
      "Complete",
    );
    style = STATUS_COMPLETE_STYLE;
    selected = true;
  } else {
    label = resolveStatusLabel(
      t("opportunityEditor.tabs.incomplete", {}, {
        default: "Incomplete",
      }),
      "Incomplete",
    );
    style = STATUS_INCOMPLETE_STYLE;
  }

  return (
    <Chip
      label={label}
      shape="square"
      selected={selected}
      style={style}
      ariaLabel={label}
      title={label}
    />
  );
}

/**
 * Navbar slot: Opportunity form + follow-up forms as NavbarItems with status chips.
 * Must be rendered as a child of Navbar (each NavbarItem wraps itself in <li>).
 *
 * @param {string} primaryTab - Tab key for the intake Opportunity form (e.g. "proposal" / "detail").
 */
export default function FollowUpFormsNavSelect({
  primaryTab,
  followUpForms = [],
  activeTab,
  onSelectTab,
  proposalData = null,
  videoFile = null,
}) {
  const { t } = useTranslation("connect");

  const primaryTitle = t("opportunityEditor.tabs.proposal", {}, {
    default: "Opportunity form",
  });

  return (
    <>
      <NavbarItem
        selected={activeTab === primaryTab}
        onClick={() => onSelectTab(primaryTab)}
        trailingContent={<FormStatusTag kind="intake" t={t} />}
      >
        {primaryTitle}
      </NavbarItem>
      {followUpForms.map((form) => {
        const key = formTabKey(form.id);
        const complete = isProposalFormAnswerComplete(
          proposalData,
          form.id,
          videoFile,
        );
        const title =
          form.title ||
          t("opportunityEditor.tabs.followUpFallback", {}, {
            default: "Follow-up form",
          });

        return (
          <NavbarItem
            key={form.id}
            selected={activeTab === key}
            onClick={() => onSelectTab(key)}
            trailingContent={
              <FormStatusTag
                kind={complete ? "complete" : "incomplete"}
                t={t}
              />
            }
          >
            {title}
          </NavbarItem>
        );
      })}
    </>
  );
}
