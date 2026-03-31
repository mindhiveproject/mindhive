// components/DataJournal/Widgets/types/HypothesisVisualizer/Render.js
import { useEffect, useState } from "react";
import { Message, Icon } from "semantic-ui-react";

export default function Render({
  code,
  pyodide,
  sectionId,
  content,
  onFigureReadyChange,
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const hasMeaningfulFigureHtml = (figHtml) => {
    if (typeof figHtml !== "string" || !figHtml.trim()) return false;
    return /data:image\/png;base64,[A-Za-z0-9+/=\s]+/.test(figHtml);
  };

  const escapePy = (val) => {
    if (val == null || val === "") return "";
    return String(val).replace(/"/g, '\\"').replace(/\n/g, "\\n");
  };

  useEffect(() => {
    async function executeHypVis() {
      if (!pyodide || !code?.trim() || !content?.selectors || !sectionId) {
        setResult(null);
        setIsRunning(false);
        onFigureReadyChange?.(false);
        return;
      }

      const s = content.selectors || {};

      // Common required fields
      const required = ["independentVariable", "dependentVariable"];
      const hasRequired = required.every((key) => !!s[key]?.trim());

      if (!hasRequired) {
        setResult(null);
        setIsRunning(false);
        onFigureReadyChange?.(false);
        return;
      }

      const type = content.type || "abDesign";

      let variablesCode = `
hypothesisType = "${escapePy(type)}"
independentVariable = """${escapePy(s.independentVariable || "")}"""
dependentVariable   = """${escapePy(s.dependentVariable || "")}"""
graphTitle          = """${escapePy(s.graphTitle || "")}"""
      `;

      if (type === "abDesign") {
        const n = Number(s.ivConditions) || 2;
        const names = [];
        const ranks = [];
        for (let i = 1; i <= n; i++) {
          names.push(s[`condition${i}`] || `Condition ${i}`);
          let rank = Number(s[`group${i}`]);
          ranks.push(isNaN(rank) ? i : rank);
        }
        variablesCode += `
ivConditions = ${n}
conditionNames = ${JSON.stringify(names)}
conditionRanks = ${JSON.stringify(ranks)}
        `;
      } else if (type === "corStudy") {
        variablesCode += `
ivDirectionality = "${escapePy(s.ivDirectionality || "more")}"
dvDirectionality = "${escapePy(s.dvDirectionality || "more")}"
        `;
      }

      setIsRunning(true);
      setError(null);
      setResult(null);
      onFigureReadyChange?.(false);

      try {
        const funcName = `run_hypvis_${sectionId.replace(
          /[^a-zA-Z0-9_]/g,
          "_",
        )}`;

        const pythonCode = `
import json
import numpy as np
import matplotlib.pyplot as plt
from io import BytesIO
import base64
import textwrap

def to_native(obj):
    if isinstance(obj, (np.bool_, np.integer, np.floating)):
        return obj.item()
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, dict):
        return {k: to_native(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [to_native(i) for i in obj]
    return obj

# ── Injected selectors ──────────────────────────────────────────────────────
${variablesCode}

# ── Visualization logic provided by template ────────────────────────────────
${code || "fig_html = '<p>No visualization code provided</p>'"}

# ── Ensure result format ────────────────────────────────────────────────────
if 'fig_html' not in locals():
    fig_html = '<p style="color:#c53030;">No plot generated</p>'

result = {
    "success": True,
    "title": graphTitle if 'graphTitle' in locals() and graphTitle.strip() else "Hypothesis Visualization",
    "fig_html": fig_html
}

json.dumps(to_native(result))
        `.trim();

        const returned = await pyodide.runPythonAsync(pythonCode);

        if (typeof returned === "string" && returned.trim().startsWith("{")) {
          const parsed = JSON.parse(returned);
          setResult(parsed);
          onFigureReadyChange?.(
            Boolean(parsed?.success) && hasMeaningfulFigureHtml(parsed?.fig_html),
          );
        } else {
          setError("Python did not return valid JSON string");
          onFigureReadyChange?.(false);
        }
      } catch (err) {
        console.error(`[HypVis ${sectionId}] Execution failed:`, err);
        setError(`Python error: ${err.message || String(err)}`);
        onFigureReadyChange?.(false);
      } finally {
        setIsRunning(false);
      }
    }

    executeHypVis();
  }, [pyodide, code, content?.selectors, sectionId, content?.type, onFigureReadyChange]);

  // ── Rendering ─────────────────────────────────────────────────────────────
  if (isRunning) {
    return (
      <Message icon>
        <Icon name="circle notched" loading />
        <Message.Content>Generating visualization...</Message.Content>
      </Message>
    );
  }

  if (error) {
    return (
      <div
        style={{
          color: "red",
          padding: "1rem",
          background: "#fff5f5",
          borderRadius: "6px",
        }}
      >
        {error}
      </div>
    );
  }

  if (!result) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#718096",
          fontStyle: "italic",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        Configure hypothesis parameters to generate visualization
      </div>
    );
  }

  if (!result.success) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#c53030",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        {result.message || "Visualization failed – check parameters"}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: "900px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <h3 style={{ marginBottom: "1.25rem", color: "#2d3748" }}>
        {result.title}
      </h3>
      <div dangerouslySetInnerHTML={{ __html: result.fig_html }} />
    </div>
  );
}
