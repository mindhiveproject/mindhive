// components/DataJournal/Widgets/types/Graph/Render.js
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function Render({ data, code, pyodide, sectionId, content }) {
  const [figJson, setFigJson] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function renderGraph() {
      if (!pyodide || !code || !content?.selectors || !sectionId) {
        setFigJson(null);
        return;
      }

      const s = content.selectors;
      if (!s.xVariable || !s.yVariable) {
        setFigJson(null);
        return;
      }

      const prefix = `graph_${sectionId}_`;
      const funcName = `${prefix}render`;
      const outputVar = `${prefix}fig_json`;

      try {
        // Robust dedent that works in plain JS
        const dedentCode = (str) => {
          const lines = str.split("\n");
          if (lines.length <= 1) return str.trim();

          const contentLines = lines.slice(lines[0].trim() === "" ? 1 : 0);
          const minIndent = Math.min(
            ...contentLines
              .filter((line) => line.trim() !== "")
              .map((line) =>
                line.match(/^\s*/) ? line.match(/^\s*/)[0].length : 0
              )
          );

          return contentLines
            .map((line) => line.slice(minIndent))
            .join("\n")
            .trim();
        };

        const userCodeDedented = dedentCode(code);

        // Build Python code
        const pythonCode = `
def ${funcName}():
    X = "${s.xVariable.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"
    Y = "${s.yVariable.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"
    Group = "${(s.groupVariable || "")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")}"
    graphTitle = "${(s.graphTitle || "")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")}"
    color = "${(s.color || "pink").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"
    trendline = ${
      s.trendline
        ? `"${s.trendline.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`
        : "None"
    }

${
  userCodeDedented
    ? "    " + userCodeDedented.replace(/\n/g, "\n    ")
    : "    pass"
}

    # ── Return the variable the template actually uses ──
    return fig_json_output if 'fig_json_output' in locals() else None

${outputVar} = ${funcName}()
print("[DEBUG ${sectionId}] Returned value exists:", ${outputVar} is not None)
`.trim();

        console.log(`[Graph ${sectionId}] Generated Python:\n${pythonCode}`);

        await pyodide.runPythonAsync(pythonCode);

        const jsonStr = pyodide.globals.get(outputVar);
        if (jsonStr && typeof jsonStr === "string" && jsonStr.trim()) {
          setFigJson(JSON.parse(jsonStr));
          setError(null);
        } else {
          console.warn(`No valid fig_json_output produced for ${sectionId}`);
          setFigJson(null);
          setError("Graph code ran but did not produce figure JSON");
        }
      } catch (err) {
        console.error(`Graph render failed [${sectionId}]:`, err);
        setError(`Graph error: ${err.message.split("\n")[0] || err}`);
        setFigJson(null);
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
      {error ? (
        <div>{error}</div>
      ) : figJson ? (
        <Plot
          data={figJson.data}
          layout={figJson.layout}
          config={{ responsive: true }}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <div>Select variables to render the graph</div>
      )}
    </div>
  );
}
