import useTranslation from "next-translate/useTranslation";

import Chip from "../../../DesignSystem/Chip";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import {
  formTabKey,
  parseFormTabKey,
} from "../../../../lib/opportunityEditorTabs";
import { isProposalFormAnswerComplete } from "../../../../lib/opportunityProposalData";

const TRIGGER_BASE_STYLE = {
  borderRadius: "24px",
  border: "none",
  background: "transparent",
  color: "#000000",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  lineHeight: "24px",
  fontWeight: 600,
  padding: "8px 16px",
  gap: "4px",
  minWidth: 280,
};

const TRIGGER_SELECTED_STYLE = {
  background: "var(--MH-Theme-Tertiary-Medium, #D3E0E3)",
};

const OPTION_ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  width: "100%",
  boxSizing: "border-box",
};

const OPTION_TITLE_STYLE = {
  flex: "1 1 auto",
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const STATUS_CHIP_STYLE = {
  height: 24,
  paddingLeft: 8,
  paddingRight: 8,
  paddingTop: 0,
  paddingBottom: 0,
  fontSize: 12,
  lineHeight: "16px",
  flexShrink: 0,
  pointerEvents: "none",
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

const STATUS_INTAKE_STYLE = {
  ...STATUS_CHIP_STYLE,
  background: "var(--MH-Theme-Tertiary-Medium, #D3E0E3)",
  backgroundColor: "var(--MH-Theme-Tertiary-Medium, #D3E0E3)",
  border: "1px solid var(--MH-Theme-Primary-Dark, #336F8A)",
  color: "var(--MH-Theme-Primary-Dark, #336F8A)",
};

function FormStatusTag({ kind, t }) {
  let label;
  let style;
  let selected = false;

  if (kind === "intake") {
    label = t("opportunityEditor.tabs.originalIntake", {}, {
      default: "Original intake",
    });
    style = STATUS_INTAKE_STYLE;
  } else if (kind === "complete") {
    label = t("opportunityEditor.tabs.complete", {}, { default: "Complete" });
    style = STATUS_COMPLETE_STYLE;
    selected = true;
  } else {
    label = t("opportunityEditor.tabs.incomplete", {}, {
      default: "Incomplete",
    });
    style = STATUS_INCOMPLETE_STYLE;
  }

  return (
    <Chip
      label={label}
      shape="square"
      selected={selected}
      style={style}
      ariaLabel={label}
    />
  );
}

function FormOptionLabel({ title, statusKind, t }) {
  return (
    <span style={OPTION_ROW_STYLE}>
      <span style={OPTION_TITLE_STYLE}>{title}</span>
      <FormStatusTag kind={statusKind} t={t} />
    </span>
  );
}

/**
 * Navbar slot: Opportunity form + a-posteriori follow-up forms in one DropdownSelect.
 * Must be rendered as a child of Navbar (wraps itself in <li>).
 *
 * @param {string} primaryTab - Tab key for the intake Opportunity form (e.g. "proposal" / "detail").
 */
export default function FollowUpFormsNavSelect({
  primaryTab,
  followUpForms = [],
  activeTab,
  onSelectTab,
  proposalData = null,
}) {
  const { t } = useTranslation("connect");

  const primaryTitle = t("opportunityEditor.tabs.proposal", {}, {
    default: "Opportunity form",
  });

  const formsActive =
    activeTab === primaryTab || Boolean(parseFormTabKey(activeTab));
  const value = formsActive ? activeTab : "";

  const placeholder = t("opportunityEditor.tabs.additionalForms", {}, {
    default: "Forms",
  });

  const options = [
    {
      value: primaryTab,
      labelText: primaryTitle,
      label: (
        <FormOptionLabel
          title={primaryTitle}
          statusKind="intake"
          t={t}
        />
      ),
    },
    ...followUpForms.map((form) => {
      const key = formTabKey(form.id);
      const complete = isProposalFormAnswerComplete(proposalData, form.id);
      const title =
        form.title ||
        t("opportunityEditor.tabs.followUpFallback", {}, {
          default: "Follow-up form",
        });

      return {
        value: key,
        labelText: title,
        label: (
          <FormOptionLabel
            title={title}
            statusKind={complete ? "complete" : "incomplete"}
            t={t}
          />
        ),
      };
    }),
  ];

  return (
    <li style={{ display: "flex", alignItems: "center" }}>
      <DropdownSelect
        fitContent
        value={value}
        onChange={onSelectTab}
        options={options}
        placeholder={placeholder}
        ariaLabel={
          formsActive
            ? undefined
            : t("opportunityEditor.tabs.additionalFormsAria", {}, {
                default: "Select a form",
              })
        }
        triggerStyle={{
          ...TRIGGER_BASE_STYLE,
          ...(formsActive ? TRIGGER_SELECTED_STYLE : {}),
        }}
      />
    </li>
  );
}
