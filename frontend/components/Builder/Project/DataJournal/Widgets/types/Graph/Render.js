// components/DataJournal/Widgets/types/Graph/Render.js
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import {
  MessageHeader,
  MessageContent,
  Message,
  Icon,
} from "semantic-ui-react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function Render({ code, pyodide, sectionId, content }) {
  const [figJson, setFigJson] = useState(null);
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    async function renderGraph() {
      if (!pyodide || !code || !content?.selectors || !sectionId) {
        setFigJson(null);
        setIsRunning(false);
        return;
      }

      setIsRunning(true);

      const s = content.selectors;
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
        hasRequiredSelectors = !!s.X;

        if (!hasRequiredSelectors) {
          setFigJson(null);
          setIsRunning(false);
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

        const userCodeDedented = dedentCode(code);

        const pythonCode = `
def ${funcName}():
${variablesCode ? "    " + variablesCode.trim().split("\n").join("\n    ") : ""}
${
  userCodeDedented
    ? "    " + userCodeDedented.replace(/\n/g, "\n    ")
    : "    pass"
}

    return fig_json_output if 'fig_json_output' in locals() else None

${outputVar} = ${funcName}()
print("[DEBUG ${sectionId}] fig_json_output exists:", ${outputVar} is not None)
        `.trim();

        await pyodide.runPythonAsync(pythonCode);

        const jsonStr = pyodide.globals.get(outputVar);
        if (jsonStr && typeof jsonStr === "string" && jsonStr.trim()) {
          setFigJson(JSON.parse(jsonStr));
          setError(null);
        } else {
          console.warn(`No valid fig_json_output for ${sectionId}`);
          setFigJson(null);
          setError("Code ran but did not produce figure JSON");
        }
      } catch (err) {
        console.error(`Graph render failed [${sectionId}]:`, err);
        setError(`Code error: ${err.message}`);
        setFigJson(null);
      } finally {
        setIsRunning(false);
      }
    }

    renderGraph();
  }, [pyodide, code, sectionId, content]);

  return (
    <div
      className="graphArea"
      id={`figure-${sectionId}`}
      style={{ width: "100%", height: "100%" }}
    >
      {isRunning && (
        <Message icon>
          <Icon name="circle notched" loading />
          <MessageContent>
            <MessageHeader>Just one second</MessageHeader>
            The code is running.
          </MessageContent>
        </Message>
      )}

      {error ? (
        <div style={{ color: "red", padding: "1rem" }}>{error}</div>
      ) : figJson ? (
        <Plot
          data={figJson.data}
          layout={figJson.layout}
          config={{ responsive: true }}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          Select variables to render the graph
        </div>
      )}
    </div>
  );
}
