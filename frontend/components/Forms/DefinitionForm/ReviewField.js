// Read-only Q&A row matching DefinitionForm FieldShell review layout.
import { FieldShell, fieldShellLayoutProps } from "./styles";

const ANSWER_SURFACE_STYLE = {
  margin: 0,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1)",
  background: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  fontFamily: "Lato, sans-serif",
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 1.5,
  width: "100%",
  boxSizing: "border-box",
  minWidth: 0,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

/**
 * Prompt above answer — stacked review layout matching DefinitionForm fields.
 *
 * @param {React.ReactNode} label - Field prompt.
 * @param {React.ReactNode} [value] - Plain text answer (ignored when html/children set).
 * @param {string} [html] - HTML answer rendered via dangerouslySetInnerHTML.
 * @param {React.ReactNode} [children] - Custom answer content (e.g. ReadOnlyTipTap).
 * @param {boolean} [inline=false] - When true, use 1fr/2fr side-by-side layout.
 */
export default function ReviewField({
  label,
  value,
  html = null,
  children = null,
  inline = false,
}) {
  const hasLabel = label != null && label !== "";
  const hasChildren = children != null;
  const hasHtml = Boolean(html);
  const hasValue = value != null && value !== "";

  if (!hasChildren && !hasHtml && !hasValue) return null;

  let answer = null;
  if (hasChildren) {
    answer = <div className="field-control-block" style={ANSWER_SURFACE_STYLE}>{children}</div>;
  } else if (hasHtml) {
    answer = (
      <div
        className="field-control-block"
        style={ANSWER_SURFACE_STYLE}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } else {
    answer = (
      <div className="field-control-block" style={ANSWER_SURFACE_STYLE}>
        {value}
      </div>
    );
  }

  return (
    <FieldShell
      as="div"
      {...fieldShellLayoutProps({ readOnlyInline: inline && hasLabel })}
    >
      {hasLabel ? (
        <div className="field-label-block">
          <span className="label-text">{label}</span>
        </div>
      ) : null}
      {answer}
    </FieldShell>
  );
}
