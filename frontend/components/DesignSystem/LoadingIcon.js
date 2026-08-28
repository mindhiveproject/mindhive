"use client";

/**
 * Honeycomb loading icon — three rounded hexagon strokes that draw and erase
 * in sequence ("Loading icon", Figma node 5034:60).
 *
 * Paths are inlined from the Figma SVG exports (same geometry for each cell;
 * Yellow / Red / Blue names are layer labels — stroke is Neutrals Medium (#A1A1A1).
 * Animation uses CSS @keyframes with pathLength="1" and a fixed
 * stroke-dasharray, animating only stroke-dashoffset (browsers do not
 * interpolate stroke-dasharray smoothly). No motion/react dependency.
 * Always animates even when prefers-reduced-motion is set (decorative stroke
 * drawing; freezing left the icon looking broken on OS "Reduce motion").
 */

const DURATION_MS = 6304;

// Shared hexagon outline from the Figma exports (viewBox 0 0 234 269).
const HEX =
  "M116.727 22.6618L117 22.5L211.5 78.5V190.5L117 246.5L22.5 190.5V78.5L116.727 22.6618";

// Content box is 189×224; SVG asset is 234×269 with stroke overflow.
// Positions = Figma left/top of content box minus overflow inset.
const CELLS = {
  yellow: { x: 23.509, y: 184.51 },
  red: { x: 212.509, y: 184.51 },
  blue: { x: 118.509, y: 16.51 },
};

const STROKE = "var(--MH-Theme-Neutrals-Medium, #A1A1A1)";

/**
 * @param {{ size?: number, className?: string }} props
 */
export default function LoadingIcon({ size = 32, className }) {
  return (
    <>
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 470 470"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        style={{ display: "block", flexShrink: 0 }}
      >
        {/* Yellow out — draws late in the loop */}
        <g transform={`translate(${CELLS.yellow.x} ${CELLS.yellow.y})`}>
          <path
            className="mh-loadingIcon-yellowOut"
            d={HEX}
            pathLength="1"
            stroke={STROKE}
            strokeWidth="45"
            strokeLinejoin="round"
          />
        </g>
        {/* Yellow in — starts drawn, erases mid-loop */}
        <g transform={`translate(${CELLS.yellow.x} ${CELLS.yellow.y})`}>
          <path
            className="mh-loadingIcon-yellowIn"
            d={HEX}
            pathLength="1"
            stroke={STROKE}
            strokeWidth="45"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {/* Red out — draws after yellow erase */}
        <g transform={`translate(${CELLS.red.x} ${CELLS.red.y})`}>
          <path
            className="mh-loadingIcon-redOut"
            d={HEX}
            pathLength="1"
            stroke={STROKE}
            strokeWidth="45"
            strokeLinejoin="round"
          />
        </g>
        {/* Red in — starts drawn, erases early */}
        <g transform={`translate(${CELLS.red.x} ${CELLS.red.y})`}>
          <path
            className="mh-loadingIcon-redIn"
            d={HEX}
            pathLength="1"
            stroke={STROKE}
            strokeWidth="45"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {/* Blue in — draws mid-loop */}
        <g transform={`translate(${CELLS.blue.x} ${CELLS.blue.y})`}>
          <path
            className="mh-loadingIcon-blueIn"
            d={HEX}
            pathLength="1"
            stroke={STROKE}
            strokeWidth="45"
            strokeLinejoin="round"
          />
        </g>
        {/* Blue out — starts drawn, erases first */}
        <g transform={`translate(${CELLS.blue.x} ${CELLS.blue.y})`}>
          <path
            className="mh-loadingIcon-blueOut"
            d={HEX}
            pathLength="1"
            stroke={STROKE}
            strokeWidth="45"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      {/* Global rather than scoped: styled-jsx rewrites scoped keyframe names.
          Kept out of the <svg> so styled-jsx never emits a <style> inside it. */}
      <style jsx global>{`
        .mh-loadingIcon-yellowOut,
        .mh-loadingIcon-yellowIn,
        .mh-loadingIcon-redOut,
        .mh-loadingIcon-redIn,
        .mh-loadingIcon-blueIn,
        .mh-loadingIcon-blueOut {
          fill: none;
          /* Fixed dash; only offset animates — dasharray is not interpolated. */
          stroke-dasharray: 1;
          animation-duration: ${DURATION_MS}ms;
          animation-iteration-count: infinite;
          animation-fill-mode: both;
          animation-timing-function: linear;
        }

        /* Draw layers start hidden (offset 1). Erase layers start visible (0). */
        .mh-loadingIcon-yellowOut {
          stroke-dashoffset: 1;
          animation-name: mh-loadingIcon-yellowOut;
        }
        .mh-loadingIcon-yellowIn {
          stroke-dashoffset: 0;
          animation-name: mh-loadingIcon-yellowIn;
        }
        .mh-loadingIcon-redOut {
          stroke-dashoffset: 1;
          animation-name: mh-loadingIcon-redOut;
        }
        .mh-loadingIcon-redIn {
          stroke-dashoffset: 0;
          animation-name: mh-loadingIcon-redIn;
        }
        .mh-loadingIcon-blueIn {
          stroke-dashoffset: 1;
          animation-name: mh-loadingIcon-blueIn;
        }
        .mh-loadingIcon-blueOut {
          stroke-dashoffset: 0;
          animation-name: mh-loadingIcon-blueOut;
        }

        /* Yellow out draw: hold until 77.5%, ease-out to 98.1%, hold */
        @keyframes mh-loadingIcon-yellowOut {
          0%,
          77.5% {
            stroke-dashoffset: 1;
            animation-timing-function: ease-out;
          }
          98.1%,
          100% {
            stroke-dashoffset: 0;
          }
        }

        /* Yellow in erase: hold until 46.7%, ease-out to 62.3%, hold erased */
        @keyframes mh-loadingIcon-yellowIn {
          0%,
          46.7% {
            stroke-dashoffset: 0;
            animation-timing-function: ease-out;
          }
          62.3%,
          100% {
            stroke-dashoffset: -1;
          }
        }

        /* Red out draw: hold until 62%, ease-out to 77.5%, hold */
        @keyframes mh-loadingIcon-redOut {
          0%,
          62% {
            stroke-dashoffset: 1;
            animation-timing-function: ease-out;
          }
          77.5%,
          100% {
            stroke-dashoffset: 0;
          }
        }

        /* Red in erase: hold until 15.7%, ease-out to 31.1%, hold erased */
        @keyframes mh-loadingIcon-redIn {
          0%,
          15.7% {
            stroke-dashoffset: 0;
            animation-timing-function: ease-out;
          }
          31.1%,
          100% {
            stroke-dashoffset: -1;
          }
        }

        /* Blue in draw: hold until 31%, ease-out to 46.6%, hold */
        @keyframes mh-loadingIcon-blueIn {
          0%,
          31% {
            stroke-dashoffset: 1;
            animation-timing-function: ease-out;
          }
          46.6%,
          100% {
            stroke-dashoffset: 0;
          }
        }

        /* Blue out erase: ease-out 0 → 15.7%, hold erased */
        @keyframes mh-loadingIcon-blueOut {
          0% {
            stroke-dashoffset: 0;
            animation-timing-function: ease-out;
          }
          15.7%,
          100% {
            stroke-dashoffset: -1;
          }
        }
      `}</style>
    </>
  );
}
