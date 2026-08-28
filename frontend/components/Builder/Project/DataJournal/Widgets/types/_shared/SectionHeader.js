"use client";

import InfoPopover from "../../../../../../DesignSystem/InfoPopover";
import useTranslation from "next-translate/useTranslation";

/**
 * Data journal widget editor section title row with an optional resources/help
 * panel (narrow sidebar friendly). `helpAction` holds the resource links, which
 * is why the panel is a click-to-open InfoPopover rather than a hover Tooltip.
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
    margin: "10px 0",
    minWidth: 0,
  };

  return (
    <div
      className="graphEditorSectionHeader MH-Type-Title-Large"
      style={headerRowStyle}
    >
      {/* {hasIcon ?  (
        <img src={iconSrc} alt={iconAlt} style={{ display: "block", flexShrink: 0 }} />
      ) : null} */}
      <div style={{ minWidth: 0, overflowWrap: "break-word" }}>{title}</div>
      {hasHelp ? (
        <InfoPopover
          content={
            <>
              {helpContent}
              {helpAction != null ? (
                <div style={{ marginTop: helpContent != null ? 12 : 0 }}>
                  {helpAction}
                </div>
              ) : null}
            </>
          }
          align="end"
          width={360}
          ariaLabel={helpAriaLabel}
          iconSrc="/assets/icons/visualize/question_mark.svg"
        />
      ) : null}
    </div>
  );
}
