// components/DataJournal/Widgets/types/Graph/Render.js
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import useTranslation from "next-translate/useTranslation";

import JustOneSecondNotice from "../../../../../../DesignSystem/JustOneSecondNotice";
import { useWidgetSize } from "../../WidgetSizeContext";
import { DATAFRAME_SAFETY_PYTHON } from "../_shared/pyodideDataframeSafety";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function Render({
  code,
  pyodide,
  sectionId,
  content,
  onFigureReadyChange,
}) {
  const { t } = useTranslation("builder");
  const { width, height, version } = useWidgetSize();
  const graphDivRef = useRef(null);
  const [figJson, setFigJson] = useState(null);
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const graphType = content?.type;

  const getGraphEmptyStateImageSrc = (type) => {
    if (type === "barGraph") return "/assets/dataviz/componentPanel/barChart.svg";
    if (type === "scatterPlot")
      return "/assets/dataviz/componentPanel/scatterPlot.svg";
    if (type === "histogram") return "/assets/dataviz/componentPanel/histogram.svg";
    return "/assets/dataviz/componentPanel/barChart.svg";
  };

  const normalizeGraphSelectors = (selectors, type) => {
    const normalized = { ...(selectors || {}) };

    if (type === "scatterPlot") {
      const x = normalized.xVariable == null ? "" : String(normalized.xVariable).trim();
      const y = normalized.yVariable == null ? "" : String(normalized.yVariable).trim();
      const group =
        normalized.groupVariable == null
          ? ""
          : String(normalized.groupVariable).trim();

      normalized.xVariable = x;
      normalized.yVariable = y && y !== x ? y : "";
      normalized.groupVariable = group;
    }

    if (type === "barGraph" && Array.isArray(normalized.colToPlot)) {
      const seen = new Set();
      normalized.colToPlot = normalized.colToPlot.filter((value) => {
        const next = value == null ? "" : String(value).trim();
        if (!next || seen.has(next)) return false;
        seen.add(next);
        return true;
      });
    }

    if (type === "histogram" && Array.isArray(normalized.X)) {
      const seen = new Set();
      normalized.X = normalized.X.filter((value) => {
        const next = value == null ? "" : String(value).trim();
        if (!next || seen.has(next)) return false;
        seen.add(next);
        return true;
      });
    }

    return normalized;
  };

  useEffect(() => {
    async function renderGraph() {
      if (!pyodide || !code || !content?.selectors || !sectionId) {
        setFigJson(null);
        setIsRunning(false);
        onFigureReadyChange?.(false);
        return;
      }

      setIsRunning(true);
      onFigureReadyChange?.(false);

      const s = normalizeGraphSelectors(content.selectors, content.type);
      const type = content.type;

      // ── Very defensive escaping for Python string literals ──────────────────
      const escaped = (val) => {
        if (val == null) return "";
        if (Array.isArray(val)) {
          return val.map(String).join(",");
        }
        const str = String(val);
        return str.replace(/"/g, '\\"').replace(/\n/g, "\\n");
      };

      let variablesCode = "";
      let hasRequiredSelectors = false;

      if (type === "scatterPlot") {
        hasRequiredSelectors = !!s.xVariable && !!s.yVariable;
        if (!hasRequiredSelectors) {
          setFigJson(null);
          setIsRunning(false);
          onFigureReadyChange?.(false);
          return;
        }
        variablesCode = `
X = "${escaped(s.xVariable)}"
Y = "${escaped(s.yVariable)}"
Group = "${escaped(s.groupVariable || "")}"
graphTitle = "${escaped(s.graphTitle || "")}"
xLabel = "${escaped(s.xLabel || "")}"
yLabel = "${escaped(s.yLabel || "")}"
xRangeMin = "${escaped(s.xRangeMin || "")}"
xRangeMax = "${escaped(s.xRangeMax || "")}"
yRangeMin = "${escaped(s.yRangeMin || "")}"
yRangeMax = "${escaped(s.yRangeMax || "")}"
marginalPlot = "${escaped(s.marginalPlot || "")}"
legend_title_text = "${escaped(s.legend_title_text || "")}"
color = "${escaped(s.color || "pink")}"
trendline = ${s.trendLine ? "True" : "False"}
        `;
      } else if (type === "barGraph") {
        const dataFormatStr = String(s.dataFormat || "")
          .trim()
          .toLowerCase();
        const isLong = dataFormatStr === "long" || !dataFormatStr;
        const isWide = dataFormatStr === "wide";

        hasRequiredSelectors = isWide
          ? Array.isArray(s.colToPlot) && s.colToPlot.length > 0
          : !!s.qualCol && !!s.quantCol;

        if (!hasRequiredSelectors) {
          setFigJson(null);
          setIsRunning(false);
          onFigureReadyChange?.(false);
          return;
        }

        variablesCode = `
dataFormat = "${escaped(dataFormatStr)}"
isWide = ${isWide ? "True" : "False"}
qualCol = "${escaped(s.qualCol || "")}"
quantCol = "${escaped(s.quantCol || "")}"
colToPlot = "${escaped(s.colToPlot || "")}"
errBar = "${escaped(s.errBar || "")}"
graphTitle = "${escaped(s.graphTitle || "")}"
xLabel = "${escaped(s.xLabel || "")}"
yLabel = "${escaped(s.yLabel || "")}"
yRangeMin = "${escaped(s.yRangeMin || "")}"
yRangeMax = "${escaped(s.yRangeMax || "")}"
legend_title = "${escaped(s.legend_title || s.legend_title_text || "")}"
color = "${escaped(s.color || "pink")}"
        `;
      } else if (type === "histogram") {
        // X may be a string (legacy) or string[] from multi-select; platform joins arrays
        // to a comma-separated string for Python. Reject empty arrays (truthy in JS).
        const hasHistogramX =
          Array.isArray(s.X) && s.X.length > 0
            ? s.X.some((v) => v != null && String(v).trim() !== "")
            : s.X != null && String(s.X).trim() !== "";

        hasRequiredSelectors = hasHistogramX;

        if (!hasRequiredSelectors) {
          setFigJson(null);
          setIsRunning(false);
          onFigureReadyChange?.(false);
          return;
        }

        variablesCode = `
X = "${escaped(s.X || "")}"
Group = "${escaped(s.Group || "")}"
marginalPlot = "${escaped(s.marginalPlot || "")}"
graphTitle = "${escaped(s.graphTitle || "")}"
xLabel = "${escaped(s.xLabel || "")}"
yLabel = "${escaped(s.yLabel || "")}"
xRangeMin = "${escaped(s.xRangeMin || "")}"
xRangeMax = "${escaped(s.xRangeMax || "")}"
yRangeMin = "${escaped(s.yRangeMin || "")}"
yRangeMax = "${escaped(s.yRangeMax || "")}"
legend_title_text = "${escaped(s.legend_title_text || "")}"
color = "${escaped(s.color || "")}"
bargap = ${Number(s.bargap ?? 0.1)}
        `;
      } else {
        setError(`Unsupported graph type: ${type}`);
        setIsRunning(false);
        onFigureReadyChange?.(false);
        return;
      }

      const prefix = `graph_${sectionId}_`;
      const funcName = `${prefix}render`;
      const outputVar = `${prefix}fig_json`;

      try {
        // Robust dedent helper
        const dedentCode = (str) => {
          const lines = str.split("\n");
          if (lines.length <= 1) return str.trim();

          const contentLines = lines.slice(lines[0].trim() === "" ? 1 : 0);
          const minIndent = Math.min(
            ...contentLines
              .filter((line) => line.trim() !== "")
              .map((line) => line.match(/^\s*/)?.[0]?.length || 0),
          );

          return contentLines
            .map((line) => line.slice(minIndent))
            .join("\n")
            .trim();
        };

        let userCodeDedented = dedentCode(code);

        // Persisted scatter templates: ensure participant is in cols_to_use before groupby (indent-safe).
        if (
          type === "scatterPlot" &&
          userCodeDedented &&
          /groupby\(\s*['"]participant['"]\s*\)/.test(userCodeDedented) &&
          !/participant['"] not in cols_to_use/.test(userCodeDedented) &&
          /df_plot\s*=\s*df\[cols_to_use\]\.copy\(\)/.test(userCodeDedented)
        ) {
          userCodeDedented = userCodeDedented.replace(
            /^(\s*)(df_plot\s*=\s*df\[cols_to_use\]\.copy\(\))/m,
            (match, indent, dfLine) =>
              `${indent}if not userDefWide and 'participant' in df.columns and 'participant' not in cols_to_use: cols_to_use.append('participant')\n${indent}${dfLine}`,
          );
        }

        const pythonCode = `
import pandas as pd
${DATAFRAME_SAFETY_PYTHON}
def ${funcName}():
${variablesCode ? "    " + variablesCode.trim().split("\n").join("\n    ") : ""}
${
  userCodeDedented
    ? "    " + userCodeDedented.replace(/\n/g, "\n    ")
    : "    pass"
}

    return fig_json_output if 'fig_json_output' in locals() else None

${outputVar} = ${funcName}()
        `.trim();

        await pyodide.runPythonAsync(pythonCode);

        const jsonStr = pyodide.globals.get(outputVar);
        if (jsonStr && typeof jsonStr === "string" && jsonStr.trim()) {
          const parsed = JSON.parse(jsonStr);
          const hasMeaningfulFigure =
            Array.isArray(parsed?.data) && parsed.data.length > 0;
          setFigJson(parsed);
          setError(null);
          onFigureReadyChange?.(hasMeaningfulFigure);
        } else {
          console.warn(`No valid fig_json_output for ${sectionId}`);
          setFigJson(null);
          setError("Code ran but did not produce figure JSON");
          onFigureReadyChange?.(false);
        }
      } catch (err) {
        console.error(`Graph render failed [${sectionId}]:`, err);
        setError(`Code error: ${err.message}`);
        setFigJson(null);
        onFigureReadyChange?.(false);
      } finally {
        setIsRunning(false);
      }
    }

    renderGraph();
  }, [pyodide, code, sectionId, content, onFigureReadyChange]);

  const hasPlotData = Boolean(figJson?.data?.length);

  // Grid/widget container resize does not fire window.resize; Plotly listens on window.
  // Synthetic resize triggers react-plotly's useResizeHandler so the SVG tracks the widget.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("resize"));
  }, [width, height, version, hasPlotData]);

  return (
    <div
      className="graphArea"
      id={`figure-${sectionId}`}
      style={{ width: "100%", height: "100%" }}
    >
      {isRunning && <JustOneSecondNotice variant="codeRunning" />}

      {error ? (
        <div style={{ color: "red", padding: "1rem" }}>{error}</div>
      ) : figJson ? (
        <Plot
          data={figJson.data}
          layout={figJson.layout}
          config={{ responsive: true }}
          useResizeHandler
          onInitialized={(_, graphDiv) => {
            graphDivRef.current = graphDiv;
          }}
          onUpdate={(_, graphDiv) => {
            graphDivRef.current = graphDiv;
          }}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "#4b5563",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            gap: "0.5rem",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#DEF8FB",
            borderRadius: "12px",
            border: "1px solid #A1A1A1",
            height: "100%",
            overflow: "clip",
          }}
     
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: "16px", textAlign: "left" }}>
              {t(
                "dataJournal.graph.emptyState.title",
                {},
                { default: "Your graph is ready to be configured" },
              )}
            </div>
            <img
              src={getGraphEmptyStateImageSrc(graphType)}
              alt={t(
                "dataJournal.graph.emptyState.title",
                {},
                { default: "Your graph is ready to be configured" },
              )}
              style={{
                width: "88px",
                height: "56px",
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
          </div>
          {/* <div
            style={{
              background: "#ffffff",
              padding: "0.35rem 0.65rem",
              borderRadius: "6px",
              color: "#3f3f46",
              fontSize: "14px",
              border: "2px solid #A1A1A1",
            }}
          >
            {t(
              "dataJournal.graph.emptyState.helper",
              {},
              {
                default:
                  "Click this component to open the editor, then choose variables to preview your visualization.",
              },
            )}
          </div> */}
        </div>
      )}
    </div>
  );
}
