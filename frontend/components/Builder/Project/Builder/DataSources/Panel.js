"use client";

import useTranslation from "next-translate/useTranslation";

import Panel from "../../../../DesignSystem/Panel";
import Button from "../../../../DesignSystem/Button";
import IconButton from "../../../../DesignSystem/IconButton";
import { SettingsIcon } from "../../../../DesignSystem/Icons";

const ROOT_STYLE = {
  width: 320,
  maxWidth: "calc(100vw - 32px)",
  maxHeight: "calc(100% - 32px)",
  pointerEvents: "auto",
};

const EMPTY_STYLE = {
  margin: 0,
  color: "var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
};

const ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "12px 8px 12px 16px",
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
};

// Selected means "this source's settings panel is open" — same fill the
// Visual Builder's parameter cards use for their active row, border unchanged.
const ROW_SELECTED_STYLE = {
  background: "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)",
};

const ROW_TEXT_STYLE = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minWidth: 0,
};

const ROW_TITLE_STYLE = {
  margin: 0,
  // Figma draws these Semibold; MH-Type-Title-Base is Medium (500).
  fontWeight: 600,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const ROW_SUBTITLE_STYLE = {
  margin: 0,
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

/**
 * The persistent "External data sources" card, pinned to the bottom-left of
 * the study builder canvas (Figma node 445-3380). Linking real-time data
 * sources into a study is a big, easy-to-forget commitment, so this stays
 * visible instead of being tucked behind a menu tab. Built on the
 * DesignSystem `Panel` shell shared with the study run's data preview panel
 * and the visual builder's work panels.
 */
export default function DataSourcesPanel({
  sources,
  selectedSourceId,
  onOpenLink,
  onOpenSettings,
}) {
  const { t } = useTranslation("builder");

  return (
    <Panel
      className="dataSourcesPanel"
      title={t("dataSources.panelTitle", {}, { default: "External data sources" })}
      subtitle={t("dataSources.panelSubtitle", {}, {
        default: "This study collects data from external devices",
      })}
      actions={
        <Button variant="filled" tone="tertiary" onClick={onOpenLink}>
          {t("dataSources.more", {}, { default: "More" })}
        </Button>
      }
      style={ROOT_STYLE}
      bodyStyle={{ padding: "0 16px 16px", gap: 8 }}
    >
      {sources.length === 0 ? (
        <p className="MH-Type-Body-Base " style={EMPTY_STYLE}>
          {t("dataSources.panelEmpty", {}, {
            default: "No data sources linked to this study yet.",
          })}
        </p>
      ) : (
        sources.map((source) => (
          <div
            key={source.id}
            style={
              source.id === selectedSourceId
                ? { ...ROW_STYLE, ...ROW_SELECTED_STYLE }
                : ROW_STYLE
            }
          >
            <div style={ROW_TEXT_STYLE}>
              <p className="MH-Type-Title-Base" style={ROW_TITLE_STYLE}>
                {source.label || source.block?.title}
              </p>
              <p className="MH-Type-Body-Base" style={ROW_SUBTITLE_STYLE}>
                {source.block?.requirementLabel || source.block?.title}
              </p>
            </div>
            <IconButton
              variant="neutral"
              icon={<SettingsIcon />}
              ariaLabel={t("dataSources.settingsLabel", {}, { default: "Settings" })}
              title={t("dataSources.settingsLabel", {}, { default: "Settings" })}
              onClick={() => onOpenSettings(source.id)}
            />
          </div>
        ))
      )}
    </Panel>
  );
}
