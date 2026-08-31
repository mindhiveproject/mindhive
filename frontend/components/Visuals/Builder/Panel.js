"use client";

const ROOT_STYLE = {
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  minHeight: 0,
  height: "100%",
  borderRadius: 12,
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  overflow: "hidden",
};

const HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  flexShrink: 0,
  padding: "16px 16px 0",
};

// MH-Theme/title/large
const TITLE_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Title-Large)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const ACTIONS_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
};

// The 12px above the first row is the panel's own gap in Figma rather than a
// margin on whatever lands there, so it holds for every panel — including the
// flush ones, whose content only gives up its horizontal edges.
const BODY_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  minHeight: 0,
  flex: "1 1 0%",
  overflowY: "auto",
  overflowX: "hidden",
  padding: "12px 16px 8px",
};

/**
 * The white 12px-radius surface every work panel and the Preview share: a
 * title row with an actions slot, then a scrolling body.
 *
 * @param {React.ReactNode} title - Panel heading.
 * @param {React.ReactNode} [actions] - Controls on the right of the heading.
 * @param {React.ReactNode} children - Panel body.
 * @param {boolean} [flush=false] - Drops the body's padding and gap, for panels
 *   whose content owns its own edges (the code editor, the preview canvas).
 * @param {React.CSSProperties} [style] - Override for the root.
 */
export default function Panel({
  title,
  actions = null,
  children,
  flush = false,
  style = {},
}) {
  return (
    <section className="Visuals-Panel" style={{ ...ROOT_STYLE, ...style }}>
      <header style={HEADER_STYLE}>
        <h2 style={TITLE_STYLE}>{title}</h2>
        {actions ? <div style={ACTIONS_STYLE}>{actions}</div> : null}
      </header>
      <div
        style={
          flush
            ? { ...BODY_STYLE, gap: 0, padding: "12px 0 0", overflow: "hidden" }
            : BODY_STYLE
        }
      >
        {children}
      </div>
    </section>
  );
}
