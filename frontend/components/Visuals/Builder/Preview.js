"use client";

import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import Panel from "./Panel";
import P5Frame from "../Runtime/P5Frame";
import { ChevronRightIcon } from "../../DesignSystem/Icons";

const STAGE_STYLE = {
  flex: "1 1 0%",
  minHeight: 0,
  margin: "0 16px 16px",
  borderRadius: 12,
  overflow: "hidden",
  background: "var(--MH-Theme-Neutrals-Black, #171717)",
};

// Full screen is a style change on the *same* element rather than a portal into
// a new one: re-parenting the panel would remount the iframe and restart the
// sketch, throwing away whatever state it had built up.
const FULLSCREEN_STYLE = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  borderRadius: 0,
  border: "none",
};

const CONSOLE_STYLE = {
  flexShrink: 0,
  maxHeight: 140,
  overflowY: "auto",
  margin: "0 16px 16px",
  padding: 12,
  borderRadius: 8,
  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
  fontFamily:
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
  fontSize: 12,
  lineHeight: "18px",
};

/**
 * @param {boolean} [paused=false] - Set while the panel is collapsed. The frame
 *   stays mounted so the sketch survives being shut away, but there is nothing
 *   to look at, so it stops drawing.
 */
export default function Preview({
  files,
  values,
  logs = [],
  paused = false,
  onDeclare,
  onLog,
  onHide,
}) {
  const { t } = useTranslation("visuals");
  const [fullscreen, setFullscreen] = useState(false);

  // Errors are what an author actually needs to see; ordinary console output is
  // relayed too but never on its own worth pushing the canvas up — the Code
  // panel's console has all of it.
  const errors = logs.filter((entry) => entry.kind === "error");

  return (
    <Panel
      flush
      title={t("preview", "Preview")}
      style={fullscreen ? FULLSCREEN_STYLE : undefined}
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => setFullscreen((on) => !on)}
          >
            {fullscreen
              ? t("exitFullScreen", "Exit Full Screen")
              : t("fullScreen", "Full Screen")}
          </Button>
          {onHide && !fullscreen ? (
            <Button
              variant="text"
              leadingIcon={<ChevronRightIcon />}
              onClick={onHide}
            >
              {t("hide", "Hide")}
            </Button>
          ) : null}
        </>
      }
    >
      <div style={STAGE_STYLE}>
        <P5Frame
          files={files}
          values={values}
          paused={paused}
          onDeclare={onDeclare}
          onLog={onLog}
        />
      </div>
      {errors.length ? (
        <div style={CONSOLE_STYLE} role="log">
          {errors.map((entry, index) => (
            <div
              key={index}
              style={{ color: "var(--MH-Theme-Warning-Base, #b9261a)" }}
            >
              {entry.line ? `Line ${entry.line}: ` : ""}
              {entry.message}
            </div>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}
