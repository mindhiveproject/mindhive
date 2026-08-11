"use client";

/**
 * Beehive bloom — the full-bleed loading animation from Figma
 * ("Beehive Base Pattern Animation", node 1188:753).
 *
 * A single green hexagon draws itself at centre, a pale honeycomb blooms
 * outward around it, the green hexagon turns pale to join the grid, and the
 * whole thing fades back out. Loops every 3s.
 *
 * Rebuilt rather than imported: Figma exports this as 97 separate <img> SVGs,
 * which is 97 network requests on the one screen that exists because the app
 * has not loaded yet. Instead the 96 pattern hexagons are inlined as 14 <path>
 * elements — one per distinct timing curve, each holding every cell that
 * shares that curve as a subpath. That means 15 animated nodes instead of 97,
 * 15 opacity animations instead of 97, and zero requests.
 */

// Total loop length. Figma's timeline is 4607ms; tightened here so the tail
// where the grid has faded out and nothing is on screen reads as a beat
// rather than a stall.
const DURATION_MS = 3000;

// The pale grid colour, sampled from the Figma export. No --MH-Theme token
// carries it (StyledReview.js hardcodes the same value).
const GRID = "#E4EFEE";

// "slice" scales the Figma frame up until it covers the viewport, cropping the
// overflow — the SVG equivalent of background-size: cover. The frame's own box
// is kept as the viewBox: the grid is centred within it, so any other window
// leaves an empty gutter along one edge.
const SVG_STYLE = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};

/**
 * Hexagon outlines grouped by the timing curve they share: 14 groups, 96 cells.
 * Positions are snapped to the honeycomb lattice (112.368 x 124.715 pointy-top,
 * 3/4 row step), which lands within 2.25px of Figma and drops the sub-pixel
 * jitter that would otherwise show up along shared edges.
 */
const CELLS = {
  a: "M347.47 374.54L403.65 405.72V468.08L347.47 499.26L291.29 468.08V405.72ZM235.1 374.54L291.29 405.72V468.08L235.1 499.26L178.92 468.08V405.72ZM459.84 374.54L516.02 405.72V468.08L459.84 499.26L403.65 468.08V405.72ZM403.65 281L459.84 312.18V374.54L403.65 405.72L347.47 374.54V312.18ZM291.29 281L347.47 312.18V374.54L291.29 405.72L235.1 374.54V312.18ZM122.73 374.54L178.92 405.72V468.08L122.73 499.26L66.55 468.08V405.72ZM66.55 468.08L122.73 499.26V561.61L66.55 592.79L10.37 561.61V499.26ZM235.1 187.47L291.29 218.65V281L235.1 312.18L178.92 281V218.65ZM459.84 187.47L516.02 218.65V281L459.84 312.18L403.65 281V218.65ZM516.02 281L572.21 312.18V374.54L516.02 405.72L459.84 374.54V312.18ZM516.02 468.08L572.21 499.26V561.61L516.02 592.79L459.84 561.61V499.26ZM572.21 187.47L628.39 218.65V281L572.21 312.18L516.02 281V218.65ZM628.39 93.93L684.57 125.11V187.47L628.39 218.65L572.21 187.47V125.11ZM1358.78 0.4L1414.97 31.57V93.93L1358.78 125.11L1302.6 93.93V31.57ZM1302.6 93.93L1358.78 125.11V187.47L1302.6 218.65L1246.41 187.47V125.11ZM1414.97 93.93L1471.15 125.11V187.47L1414.97 218.65L1358.78 187.47V125.11ZM1471.15 0.4L1527.33 31.57V93.93L1471.15 125.11L1414.97 93.93V31.57ZM1302.6 281L1358.78 312.18V374.54L1302.6 405.72L1246.41 374.54V312.18ZM1414.97 281L1471.15 312.18V374.54L1414.97 405.72L1358.78 374.54V312.18ZM1471.15 561.61L1527.33 592.79V655.15L1471.15 686.33L1414.97 655.15V592.79ZM1358.78 187.47L1414.97 218.65V281L1358.78 312.18L1302.6 281V218.65ZM1583.52 561.61L1639.7 592.79V655.15L1583.52 686.33L1527.33 655.15V592.79ZM965.49 93.93L1021.68 125.11V187.47L965.49 218.65L909.31 187.47V125.11ZM1527.33 468.08L1583.52 499.26V561.61L1527.33 592.79L1471.15 561.61V499.26ZM909.31 0.4L965.49 31.57V93.93L909.31 125.11L853.13 93.93V31.57ZM1527.33 281L1583.52 312.18V374.54L1527.33 405.72L1471.15 374.54V312.18ZM1583.52 187.47L1639.7 218.65V281L1583.52 312.18L1527.33 281V218.65ZM403.65 842.22L459.84 873.4V935.76L403.65 966.94L347.47 935.76V873.4ZM291.29 842.22L347.47 873.4V935.76L291.29 966.94L235.1 935.76V873.4ZM347.47 935.76L403.65 966.94V1029.29L347.47 1060.47L291.29 1029.29V966.94ZM459.84 935.76L516.02 966.94V1029.29L459.84 1060.47L403.65 1029.29V966.94ZM516.02 842.22L572.21 873.4V935.76L516.02 966.94L459.84 935.76V873.4ZM459.84 748.69L516.02 779.86V842.22L459.84 873.4L403.65 842.22V779.86ZM122.73 1122.83L178.92 1154.01V1216.37L122.73 1247.55L66.55 1216.37V1154.01ZM235.1 1122.83L291.29 1154.01V1216.37L235.1 1247.55L178.92 1216.37V1154.01ZM291.29 655.15L347.47 686.33V748.69L291.29 779.86L235.1 748.69V686.33ZM459.84 1122.83L516.02 1154.01V1216.37L459.84 1247.55L403.65 1216.37V1154.01ZM516.02 1029.29L572.21 1060.47V1122.83L516.02 1154.01L459.84 1122.83V1060.47ZM291.29 1029.29L347.47 1060.47V1122.83L291.29 1154.01L235.1 1122.83V1060.47ZM740.76 1029.29L796.94 1060.47V1122.83L740.76 1154.01L684.57 1122.83V1060.47ZM1358.78 935.76L1414.97 966.94V1029.29L1358.78 1060.47L1302.6 1029.29V966.94ZM1302.6 1029.29L1358.78 1060.47V1122.83L1302.6 1154.01L1246.41 1122.83V1060.47ZM1190.23 1029.29L1246.41 1060.47V1122.83L1190.23 1154.01L1134.05 1122.83V1060.47ZM1077.86 1029.29L1134.05 1060.47V1122.83L1077.86 1154.01L1021.68 1122.83V1060.47Z",
  b: "M796.94 374.54L853.13 405.72V468.08L796.94 499.26L740.76 468.08V405.72ZM1134.05 374.54L1190.23 405.72V468.08L1134.05 499.26L1077.86 468.08V405.72ZM1134.05 561.61L1190.23 592.79V655.15L1134.05 686.33L1077.86 655.15V592.79ZM1190.23 655.15L1246.41 686.33V748.69L1190.23 779.86L1134.05 748.69V686.33ZM965.49 281L1021.68 312.18V374.54L965.49 405.72L909.31 374.54V312.18ZM796.94 748.69L853.13 779.86V842.22L796.94 873.4L740.76 842.22V779.86ZM909.31 748.69L965.49 779.86V842.22L909.31 873.4L853.13 842.22V779.86ZM965.49 842.22L1021.68 873.4V935.76L965.49 966.94L909.31 935.76V873.4Z",
  c: "M740.76 468.08L796.94 499.26V561.61L740.76 592.79L684.57 561.61V499.26ZM909.31 374.54L965.49 405.72V468.08L909.31 499.26L853.13 468.08V405.72ZM740.76 655.15L796.94 686.33V748.69L740.76 779.86L684.57 748.69V686.33Z",
  d: "M684.57 374.54L740.76 405.72V468.08L684.57 499.26L628.39 468.08V405.72ZM628.39 468.08L684.57 499.26V561.61L628.39 592.79L572.21 561.61V499.26ZM572.21 561.61L628.39 592.79V655.15L572.21 686.33L516.02 655.15V592.79ZM1190.23 468.08L1246.41 499.26V561.61L1190.23 592.79L1134.05 561.61V499.26ZM684.57 748.69L740.76 779.86V842.22L684.57 873.4L628.39 842.22V779.86Z",
  e: "M796.94 187.47L853.13 218.65V281L796.94 312.18L740.76 281V218.65ZM572.21 374.54L628.39 405.72V468.08L572.21 499.26L516.02 468.08V405.72ZM1246.41 561.61L1302.6 592.79V655.15L1246.41 686.33L1190.23 655.15V592.79ZM1246.41 374.54L1302.6 405.72V468.08L1246.41 499.26L1190.23 468.08V405.72ZM1077.86 281L1134.05 312.18V374.54L1077.86 405.72L1021.68 374.54V312.18ZM516.02 655.15L572.21 686.33V748.69L516.02 779.86L459.84 748.69V686.33ZM1134.05 935.76L1190.23 966.94V1029.29L1134.05 1060.47L1077.86 1029.29V966.94ZM1021.68 935.76L1077.86 966.94V1029.29L1021.68 1060.47L965.49 1029.29V966.94Z",
  f: "M459.84 561.61L516.02 592.79V655.15L459.84 686.33L403.65 655.15V592.79ZM1302.6 468.08L1358.78 499.26V561.61L1302.6 592.79L1246.41 561.61V499.26ZM1134.05 187.47L1190.23 218.65V281L1134.05 312.18L1077.86 281V218.65ZM909.31 187.47L965.49 218.65V281L909.31 312.18L853.13 281V218.65ZM403.65 655.15L459.84 686.33V748.69L403.65 779.86L347.47 748.69V686.33ZM572.21 748.69L628.39 779.86V842.22L572.21 873.4L516.02 842.22V779.86ZM572.21 935.76L628.39 966.94V1029.29L572.21 1060.47L516.02 1029.29V966.94ZM684.57 935.76L740.76 966.94V1029.29L684.57 1060.47L628.39 1029.29V966.94Z",
  g: "M796.94 561.61L853.13 592.79V655.15L796.94 686.33L740.76 655.15V592.79ZM965.49 468.08L1021.68 499.26V561.61L965.49 592.79L909.31 561.61V499.26Z",
  h: "M684.57 561.61L740.76 592.79V655.15L684.57 686.33L628.39 655.15V592.79Z",
  i: "M1358.78 561.61L1414.97 592.79V655.15L1358.78 686.33L1302.6 655.15V592.79ZM1358.78 374.54L1414.97 405.72V468.08L1358.78 499.26L1302.6 468.08V405.72ZM796.94 935.76L853.13 966.94V1029.29L796.94 1060.47L740.76 1029.29V966.94ZM628.39 842.22L684.57 873.4V935.76L628.39 966.94L572.21 935.76V873.4ZM1246.41 935.76L1302.6 966.94V1029.29L1246.41 1060.47L1190.23 1029.29V966.94Z",
  j: "M1077.86 468.08L1134.05 499.26V561.61L1077.86 592.79L1021.68 561.61V499.26ZM1021.68 561.61L1077.86 592.79V655.15L1021.68 686.33L965.49 655.15V592.79ZM853.13 468.08L909.31 499.26V561.61L853.13 592.79L796.94 561.61V499.26ZM853.13 655.15L909.31 686.33V748.69L853.13 779.86L796.94 748.69V686.33Z",
  k: "M1021.68 374.54L1077.86 405.72V468.08L1021.68 499.26L965.49 468.08V405.72ZM1077.86 655.15L1134.05 686.33V748.69L1077.86 779.86L1021.68 748.69V686.33ZM1021.68 748.69L1077.86 779.86V842.22L1021.68 873.4L965.49 842.22V779.86Z",
  l: "M965.49 655.15L1021.68 686.33V748.69L965.49 779.86L909.31 748.69V686.33Z",
  m: "M853.13 281L909.31 312.18V374.54L853.13 405.72L796.94 374.54V312.18ZM740.76 842.22L796.94 873.4V935.76L740.76 966.94L684.57 935.76V873.4ZM1077.86 842.22L1134.05 873.4V935.76L1077.86 966.94L1021.68 935.76V873.4Z",
  n: "M628.39 655.15L684.57 686.33V748.69L628.39 779.86L572.21 748.69V686.33Z",
};

// Drawn separately: this one draws its outline on, then recolours to match the
// grid it just summoned.
const LEAD = "M909.31 561.61L965.49 592.79V655.15L909.31 686.33L853.13 655.15V592.79Z";

export default function BeehiveLoading() {
  return (
    <>
      <svg
        style={SVG_STYLE}
        viewBox="0 0 1648.74 1247.33"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        {Object.entries(CELLS).map(([key, d]) => (
          <path
            key={key}
            className="mh-hive-cell"
            style={{ "--mh-hive-curve": `mh-hive-${key}` }}
            d={d}
          />
        ))}
        <path className="mh-hive-lead" d={LEAD} pathLength="1" />
      </svg>

      {/* Global rather than scoped: styled-jsx rewrites scoped keyframe names,
          which would not match the names used by the classes above. Kept out of
          the <svg> so styled-jsx never emits a <style> tag inside it. */}
      <style jsx global>{`
        /* Each path carries its curve name in --mh-hive-curve rather than in an
           inline animation-name, so the reduced-motion rule below can still win
           (an inline style would outrank it). */
        .mh-hive-cell {
          stroke: ${GRID};
          stroke-width: 10;
          opacity: 0;
          animation: var(--mh-hive-curve) ${DURATION_MS}ms linear infinite both;
        }
        .mh-hive-lead {
          stroke: var(--Button-Green, #69BBC4);
          stroke-width: 10;
          stroke-dasharray: 0 1;
          animation: mh-hive-lead ${DURATION_MS}ms linear infinite both;
        }
        @keyframes mh-hive-a {
          0% {
            opacity: 0;
          }
          14.35% {
            opacity: 0;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          53.89% {
            opacity: 0.995;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          56.91% {
            opacity: 1;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes mh-hive-b {
          0% {
            opacity: 0;
          }
          14.35% {
            opacity: 0;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          46.3% {
            opacity: 1;
          }
          53.89% {
            opacity: 1;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          75.51% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes mh-hive-c {
          0% {
            opacity: 0;
          }
          14.35% {
            opacity: 0;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          35.97% {
            opacity: 1;
          }
          53.89% {
            opacity: 1;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          75.51% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes mh-hive-d {
          0% {
            opacity: 0;
          }
          14.35% {
            opacity: 0;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          46.3% {
            opacity: 1;
          }
          53.89% {
            opacity: 1;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          87% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes mh-hive-e {
          0% {
            opacity: 0;
          }
          14.35% {
            opacity: 0;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          53.89% {
            opacity: 1;
          }
          58.37% {
            opacity: 1;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          87% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes mh-hive-f {
          0% {
            opacity: 0;
          }
          14.35% {
            opacity: 0;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          53.89% {
            opacity: 0.995;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          56.91% {
            opacity: 1;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          87% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes mh-hive-g {
          0% {
            opacity: 0;
          }
          14.35% {
            opacity: 0;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          20.73% {
            opacity: 1;
          }
          53.89% {
            opacity: 1;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          64.55% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes mh-hive-h {
          0% {
            opacity: 0;
          }
          14.35% {
            opacity: 0;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          35.97% {
            opacity: 1;
          }
          53.89% {
            opacity: 1;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          87% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes mh-hive-i {
          0% {
            opacity: 0;
          }
          14.35% {
            opacity: 0;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          53.89% {
            opacity: 1;
          }
          58.37% {
            opacity: 1;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes mh-hive-j {
          0% {
            opacity: 0;
          }
          14.35% {
            opacity: 0;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          28.83% {
            opacity: 1;
          }
          53.89% {
            opacity: 1;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          64.55% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes mh-hive-k {
          0% {
            opacity: 0;
          }
          14.35% {
            opacity: 0;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          35.97% {
            opacity: 1;
          }
          53.89% {
            opacity: 1;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          64.55% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes mh-hive-l {
          0% {
            opacity: 0;
          }
          14.35% {
            opacity: 0;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          22.99% {
            opacity: 1;
          }
          53.89% {
            opacity: 1;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          64.55% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes mh-hive-m {
          0% {
            opacity: 0;
          }
          14.35% {
            opacity: 0;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          53.89% {
            opacity: 1;
          }
          58.37% {
            opacity: 1;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          75.51% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes mh-hive-n {
          0% {
            opacity: 0;
          }
          14.35% {
            opacity: 0;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          46.3% {
            opacity: 1;
          }
          53.89% {
            opacity: 1;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes mh-hive-lead {
          0% {
            opacity: 1;
            stroke-dasharray: 0 1;
            stroke: var(--Button-Green, #69BBC4);
            animation-timing-function: ease-out;
          }
          17.7% {
            opacity: 1;
            stroke-dasharray: 1 1;
            stroke: var(--Button-Green, #69BBC4);
          }
          20.73% {
            opacity: 1;
            stroke: var(--Button-Green, #69BBC4);
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          53.89% {
            opacity: 1;
            stroke: ${GRID};
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          56.94% {
            opacity: 1;
            stroke: ${GRID};
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
          }
          59.88%,
          100% {
            opacity: 0;
            stroke: ${GRID};
          }
        }

        /* Hold the bloom instead of looping it: same picture, no motion. */
        @media (prefers-reduced-motion: reduce) {
          .mh-hive-cell {
            animation: none;
            opacity: 1;
          }
          .mh-hive-lead {
            animation: none;
            stroke-dasharray: 1 1;
          }
        }
      `}</style>
    </>
  );
}
