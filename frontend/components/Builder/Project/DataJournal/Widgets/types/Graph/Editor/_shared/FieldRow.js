"use client";

/**
 * Width-safe label + control row for graph editor fields (replaces fixed .selectorLine grid).
 */
export default function FieldRow({ label, children }) {
  return (
    <div className="graphEditorFieldRow">
      <div className="graphEditorFieldRow__label">{label}</div>
      <div className="graphEditorFieldRow__control">{children}</div>
    </div>
  );
}
