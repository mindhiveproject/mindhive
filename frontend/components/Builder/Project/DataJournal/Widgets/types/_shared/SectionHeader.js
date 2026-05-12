"use client";

import InfoTooltip from "../../../../../../DesignSystem/InfoTooltip";
import useTranslation from "next-translate/useTranslation";

const TOOLTIP_STYLE = {
  maxWidth: "min(calc(100vw - 32px), 360px)",
  width: "max-content",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  lineHeight: "20px",
};


/**
 * Data journal widget editor section title row with optional resources/help tooltip (narrow sidebar friendly).
 * When `helpAction` is set, it is passed to InfoTooltip as `action` (interactive tooltip; portal disabled per design system).
 */
export default function SectionHeader({
  title,
  iconSrc,
  iconAlt = "",
  helpContent,
  helpAction,
  helpAriaLabel,
}) {
  const { t } = useTranslation();

  const hasIcon = Boolean(iconSrc);
  const hasHelp = helpContent != null || helpAction != null;
  const useInteractiveHelp = helpAction != null;


  const gridCols =
    hasIcon && hasHelp
      ? "auto 1fr auto"
      : hasIcon
        ? "auto 1fr"
        : hasHelp
          ? "1fr auto"
          : "1fr";

  const headerRowStyle = {
    display: "grid",
    gridTemplateColumns: gridCols,
    alignItems: "center",
    gap: "10px",
    fontWeight: 700,
    fontSize: "18px",
    margin: "10px 0",
    minWidth: 0,
  };

  return (
    <div className="graphEditorSectionHeader" style={headerRowStyle}>
      {/* {hasIcon ?  (
        <img src={iconSrc} alt={iconAlt} style={{ display: "block", flexShrink: 0 }} />
      ) : null} */}
      <div style={{ minWidth: 0, overflowWrap: "break-word" }}>{title}</div>
      {hasHelp ? (
        <InfoTooltip
          content={helpContent ?? (helpAction != null ? <></> : null)}
          action={helpAction}
          position="bottomRight"
          portal={!useInteractiveHelp}
          tooltipStyle={TOOLTIP_STYLE}
          wrapperStyle={{
            position: "relative",
            display: "inline-flex",
            flexShrink: 0,
            alignItems: "center",
            zIndex: 2,
          }}
        >
          <span style={{ display: "inline-flex", flexShrink: 0 }}>
            <img
              src="/assets/icons/visualize/question_mark.svg"
              alt={helpAriaLabel || ""}
              style={{ width: 20, height: 20, cursor: "pointer", display: "block" }}
            />
          </span>
        </InfoTooltip>
      ) : null}
    </div>
  );
}
