import useTranslation from "next-translate/useTranslation";

const TRIGGER_STYLE = {
  borderRadius: "8px",
  border: "2px solid #E6E6E6",
  backgroundColor: "#F6F9F8",
  color: "#5D5763",
  fontFamily: "Inter, sans-serif",
  fontSize: "16px",
  lineHeight: "20px",
  fontWeight: 600,
  padding: "8px 12px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  width: "fit-content",
  maxWidth: "100%",
  boxSizing: "border-box",
};

const TRIGGER_ICON_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  fontSize: "16px",
  lineHeight: "20px",
};

const BLOCKED_STYLE = {
  opacity: 0.55,
  pointerEvents: "none",
  cursor: "not-allowed",
};

export default function AddComponentButton({ disabled = false, onClick }) {
  const { t } = useTranslation("builder");

  const label = t(
    "dataJournal.sideNav.addComponent",
    {},
    { default: "Add a Component" },
  );
  const ariaLabel = t(
    "dataJournal.sideNav.addComponentAria",
    {},
    { default: "Add a component to this workspace" },
  );

  return (
    <div className="addComponentBtn">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        disabled={disabled}
        style={{
          ...TRIGGER_STYLE,
          ...(disabled ? BLOCKED_STYLE : {}),
        }}
      >
        <span style={{ textAlign: "left", whiteSpace: "nowrap" }}>{label}</span>
        <span style={TRIGGER_ICON_STYLE} aria-hidden>
          +
        </span>
      </button>
    </div>
  );
}
