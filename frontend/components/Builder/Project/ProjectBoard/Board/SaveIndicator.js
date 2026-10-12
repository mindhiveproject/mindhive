import useTranslation from "next-translate/useTranslation";

/**
 * Autosave status for a card's editors (see lib/useCardHtmlAutosave.js).
 * Renders nothing while idle.
 */
export default function SaveIndicator({ saveState, connecting = false, onRetry }) {
  const { t } = useTranslation("builder");

  if (saveState === "error") {
    return (
      <span
        className="MH-Type-Body-Base"
        style={{ color: "#B3261E", display: "flex", gap: "6px", alignItems: "center" }}
      >
        {t("proposalPDF.autosave.failed", "Not saved")}
        <button
          type="button"
          onClick={() => onRetry?.()}
          style={{
            border: "none",
            background: "none",
            padding: 0,
            color: "#274E5B",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          {t("proposalPDF.autosave.retry", "Retry")}
        </button>
      </span>
    );
  }

  let label = null;
  let color = "#6a6a6a";
  if (saveState === "saving" || saveState === "pending") {
    label = t("proposalPDF.autosave.saving", "Saving…");
  } else if (saveState === "saved") {
    label = t("proposalPDF.autosave.saved", "Saved");
    color = "#1C8F36";
  } else if (connecting) {
    label = t("proposalPDF.autosave.connecting", "Connecting…");
  }
  if (!label) return null;

  return (
    <span className="MH-Type-Body-Base" style={{ color }} aria-live="polite">
      {label}
    </span>
  );
}
