"use client";

import TruncatedTooltipText from "./TruncatedTooltipText";

/**
 * Width-safe label + control row for widget editor fields (replaces fixed .selectorLine grid).
 */
export default function FieldRow({ label, children }) {
  const canClampLabel = typeof label === "string" || typeof label === "number";

  return (
    <div className="graphEditorFieldRow">
      {canClampLabel ? (
        <TruncatedTooltipText
          as="div"
          className="graphEditorFieldRow__label"
          text={label}
        />
      ) : (
        <div className="graphEditorFieldRow__label">{label}</div>
      )}
      <div className="graphEditorFieldRow__control">{children}</div>
    </div>
  );
}
