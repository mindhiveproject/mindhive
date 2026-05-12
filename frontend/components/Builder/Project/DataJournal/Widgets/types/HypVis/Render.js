// components/DataJournal/Widgets/types/HypothesisVisualizer/Render.js
import { useEffect, useState } from "react";
import styled from "styled-components";
import { Message, Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { registerJsWorkspaceFromSlice, enqueueJsWorkspaceTask } from "../../../Helpers/pyodideWorkspaceRegistration";
import useResolvedJournalSlice from "../../../Hooks/useResolvedJournalSlice";

const HypVisFigure = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
  text-align: center;

  img {
    max-width: 100%;
    height: auto;
    display: block;
  }

  svg {
    max-width: 100%;
    height: auto;
    display: block;
  }
`;

export default function Render({
  code,
  pyodide,
  sectionId,
  content,
  onFigureReadyChange,
}) {
  const { t } = useTranslation("builder");
  const { slice, sliceReady } = useResolvedJournalSlice(content);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const hypVisType = content?.type;

  const getHypVisEmptyStateImageSrc = (type) => {
    if (type === "abDesign") return "/assets/dataviz/componentPanel/abDesign.svg";
    if (type === "corStudy")
      return "/assets/dataviz/componentPanel/correlationStudy.svg";
    return "/assets/dataviz/componentPanel/abDesign.svg";
  };

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
      if (
        !pyodide ||
        !code?.trim() ||
        !content?.selectors ||
        !sectionId ||
        !sliceReady ||
        !slice
      ) {
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

        const returned = await enqueueJsWorkspaceTask(async () => {
          await registerJsWorkspaceFromSlice(pyodide, slice);
          return pyodide.runPythonAsync(pythonCode);
        });

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
  }, [
    pyodide,
    code,
    content?.selectors,
    sectionId,
    content?.type,
    content?.datasourceId,
    onFigureReadyChange,
    slice,
    sliceReady,
  ]);

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
              "dataJournal.hypVis.emptyState.title",
              {},
              { default: "Your hypothesis visualizer is ready to be configured" },
            )}
          </div>
          <img
            src={getHypVisEmptyStateImageSrc(hypVisType)}
            alt={t(
              "dataJournal.hypVis.emptyState.title",
              {},
              { default: "Your hypothesis visualizer is ready to be configured" },
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
            "dataJournal.hypVis.emptyState.helper",
            {},
            {
              default:
                "Click this component to open the editor, then complete the variables to generate the visualization.",
            },
          )}
        </div> */}
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
    <HypVisFigure>
      {/* <h3 style={{ marginBottom: "1.25rem", color: "#2d3748" }}>
        {result.title}
      </h3> */}
      <div dangerouslySetInnerHTML={{ __html: result.fig_html }} />
    </HypVisFigure>
  );
}
