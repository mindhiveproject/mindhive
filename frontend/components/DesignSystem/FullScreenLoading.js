"use client";

import useTranslation from "next-translate/useTranslation";

// import BeehiveLoading from "./BeehiveLoading";

/**
 * Full-screen loading state for when the page cannot be drawn yet — currently
 * only "we don't know who you are yet" on a gated route.
 *
 * Deliberately fades in AFTER a short delay: auth that resolves from a warm
 * Apollo cache in <150ms should show nothing at all, because a full-screen
 * flash is worse than the wait it covers. The delay is pure CSS, so there is
 * no timer and no extra render.
 *
 * For slow work happening *inside* an already-drawn page (Pyodide booting,
 * code running), use JustOneSecondNotice instead.
 */

/**
 * Which animation to show. Flip this to compare the two:1
 *
 *   "beehive" — full-bleed honeycomb blooming out of a green hexagon, no
 *               wordmark. The Figma design.
 *   "dots"    — the wordmark with three pulsing dots underneath.
 */
const ANIMATION = "dots";

const OVERLAY_STYLE = {
  position: "fixed",
  inset: 0,
  zIndex: 20040,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  opacity: 0,
  animation: "mh-fullScreenLoading-fadeIn 200ms ease-out 150ms forwards",
};

// Small gap on purpose: the dots sit in the middle of the 96px slot below, so
// the whitespace you actually see is this plus ~42px of empty slot.
const CONTENT_STYLE = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
};

// 447x127 in the source file; fixing the width keeps the ratio and stops the
// group from shifting once the SVG decodes.
const LOGO_STYLE = {
  width: 180,
  height: "auto",
};

// Fixed box so swapping the placeholder for the real animation doesn't shift
// anything around it.
const SLOT_STYLE = {
  width: 96,
  height: 96,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

// #357A70 is the green in mh_logo_color.svg, sampled so the dots match the
// logo sitting directly above them. No existing --MH-Theme token carries it.
const DOT_STYLE = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "var(--MH-Theme-Primary-Green, #357A70)",
  animation: "mh-fullScreenLoading-pulse 1200ms ease-in-out infinite",
};

const SR_ONLY_STYLE = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export default function FullScreenLoading({ label }) {
  const { t } = useTranslation("common");

  return (
    <div style={OVERLAY_STYLE} role="status" aria-live="polite">
      {/* Replace for behive animation here*/}
        <div style={CONTENT_STYLE}>
          <img src="/mh_logo_color.svg" alt="mindHIVE" style={LOGO_STYLE} />

          <div style={SLOT_STYLE}>
            <span style={DOT_STYLE} />
            <span style={{ ...DOT_STYLE, animationDelay: "160ms" }} />
            <span style={{ ...DOT_STYLE, animationDelay: "320ms" }} />
          </div>
        </div>
      
      <span style={SR_ONLY_STYLE}>{label || t("loading", "Loading…")}</span>

      {/* Global rather than scoped: styled-jsx rewrites scoped keyframe names,
          which would not match the names used in the inline styles above. */}
      <style jsx global>{`
        @keyframes mh-fullScreenLoading-fadeIn {
          to {
            opacity: 1;
          }
        }
        @keyframes mh-fullScreenLoading-pulse {
          0%,
          100% {
            opacity: 0.25;
            transform: scale(0.85);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes mh-fullScreenLoading-pulse {
            0%,
            100% {
              opacity: 0.6;
              transform: none;
            }
          }
        }
      `}</style>
    </div>
  );
}
