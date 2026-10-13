"use client";

import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import { LinkOffIcon, PlugIcon } from "../../DesignSystem/Icons";

// Floats over the canvas, clear of it at the bottom edge, like an M3 snackbar.
const STACK_STYLE = {
  position: "fixed",
  left: 16,
  right: 16,
  bottom: 16,
  zIndex: 30,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
  pointerEvents: "none",
};

// The snackbar's inverse surface: the list item from the connect screen, white
// on dark instead of dark on white.
const TOAST_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  width: "100%",
  maxWidth: 480,
  minHeight: 64,
  padding: "8px 8px 8px 16px",
  boxSizing: "border-box",
  borderRadius: 12,
  background: "var(--MH-Theme-Neutrals-Black, #171717)",
  boxShadow: "var(--MH-Theme-Elevation-High, 2px 2px 12px rgba(0, 0, 0, 0.19))",
  color: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  pointerEvents: "auto",
};

// Past the gate, an input only needs attention once it has stopped delivering:
// dropped, failed to come back, or on its way back. A required one that isn't
// connected for any reason counts too, since the visual is starved without it.
function needsAttention(input, status) {
  if (status === "connected") return false;
  if (status === "lost" || status === "error" || status === "connecting") return true;
  return !!input.required;
}

/**
 * One toast per device input that has dropped since the participant passed
 * the connect screen, each with the same connect action the screen had —
 * so a headband wandering out of range mid-visual can be brought back without
 * leaving full screen.
 */
export default function DisconnectedToasts({ rows, apis }) {
  const { t } = useTranslation("visuals");

  const items = rows.flatMap((row) => {
    const api = apis[row.id];
    if (!api) return [];
    return (api.inputs || []).flatMap((input) => {
      const status = api.inputStatus[input.id];
      if (!needsAttention(input, status?.status)) return [];
      return [{ row, api, input, status }];
    });
  });

  if (!items.length) return null;

  return (
    <div style={STACK_STYLE} role="status" aria-live="polite">
      {items.map(({ row, api, input, status }) => {
        const connecting = status?.status === "connecting";
        const supporting =
          status?.status === "error"
            ? status.error || t("couldNotConnect", "Could not connect")
            : row.label || row.block.title;
        return (
          <div key={`${row.id}:${input.id}`} style={TOAST_STYLE}>
            <LinkOffIcon width={24} height={24} style={{ flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
              <span className="MH-Type-Title-Base">
                {t("deviceDisconnected", "{{device}} disconnected", {
                  device: status?.deviceLabel || input.label,
                })}
              </span>
              <span
                className="MH-Type-Body-Base"
                style={{ color: "var(--MH-Theme-Neutrals-Medium, #A1A1A1)" }}
              >
                {supporting}
              </span>
            </div>
            <Button
              variant="tonal"
              leadingIcon={<PlugIcon />}
              onClick={() => api.connect(input.id)}
              disabled={connecting}
            >
              {connecting
                ? t("connecting", "Connecting…")
                : t("reconnect", "Reconnect")}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
