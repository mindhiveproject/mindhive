"use client";

import InfoTooltip from "../../../../../../../../DesignSystem/InfoTooltip";

const TOOLTIP_STYLE = {
  maxWidth: "min(calc(100vw - 32px), 360px)",
  width: "max-content",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  lineHeight: "20px",
};

/**
 * Graph editor section title row with optional resources/help tooltip (narrow sidebar friendly).
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
  const headerRowStyle = {
    display: "grid",
    gridTemplateColumns:
      helpContent != null || helpAction != null ? "auto 1fr auto" : "auto 1fr",
    alignItems: "center",
    gap: "10px",
    fontWeight: 700,
    fontSize: "18px",
    margin: "10px 0",
    minWidth: 0,
  };

  const hasHelp = helpContent != null || helpAction != null;
  const useInteractiveHelp = helpAction != null;

  return (
    <div className="graphEditorSectionHeader" style={headerRowStyle}>
      <img src={iconSrc} alt={iconAlt} style={{ display: "block", flexShrink: 0 }} />
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
