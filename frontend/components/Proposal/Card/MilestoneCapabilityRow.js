import clsx from "clsx";

const rowStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 16,
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6)",
  background: "var(--MH-Theme-Neutrals-White, #ffffff)",
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
  boxSizing: "border-box",
};

const radioWrapStyle = {
  flexShrink: 0,
  paddingTop: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
};

const headlineStyle = {
  margin: 0,
  font: 'var(--MH-Type-Title-Base)',
  letterSpacing: 0,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const supportingStyle = {
  margin: "4px 0 0",
  font: 'var(--MH-Type-Body-Base)',
  letterSpacing: 0,
  color: "var(--MH-Theme-Accent-Dark, #5d5763)",
};

export default function MilestoneCapabilityRow({
  checked = false,
  disabled = false,
  headline,
  supportingText,
  name,
  value,
  onChange,
}) {
  const handleClick = () => {
    if (disabled || checked) return;
    onChange?.(value);
  };

  const handleKeyDown = (event) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!checked) onChange?.(value);
    }
  };

  return (
    <div
      role="radio"
      aria-checked={checked}
      tabIndex={disabled ? -1 : checked ? 0 : 0}
      className={clsx("milestoneCapabilityRow", {
        milestoneCapabilityRowSelected: checked,
        milestoneCapabilityRowDisabled: disabled,
      })}
      style={{
        ...rowStyle,
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        borderColor: checked
          ? "var(--MH-Theme-Primary-Dark, #336f8a)"
          : rowStyle.border,
        background: checked
          ? "var(--MH-Theme-Primary-Light, #def8fb)"
          : rowStyle.background,
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span style={radioWrapStyle} aria-hidden>
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          readOnly
          tabIndex={-1}
          style={{
            width: 20,
            height: 20,
            margin: 0,
            accentColor: "var(--MH-Theme-Primary-Dark, #336f8a)",
            pointerEvents: "none",
          }}
        />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <p style={headlineStyle}>{headline}</p>
        <p style={supportingStyle}>{supportingText}</p>
      </span>
    </div>
  );
}
