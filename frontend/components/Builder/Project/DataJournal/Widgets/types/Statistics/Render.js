// components/DataJournal/Widgets/types/Statistics/Render.js
import { useEffect, useState } from "react";
import { Message, Icon, Table } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import { DATAFRAME_SAFETY_PYTHON } from "../_shared/pyodideDataframeSafety";

export default function Render({ code, pyodide, sectionId, content }) {
  const { t } = useTranslation("builder");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const summaryType = content?.type;

  const getStatisticsEmptyStateImageSrc = (type) => {
    if (type === "summary") return "/assets/dataviz/componentPanel/summary.svg";
    return "/assets/dataviz/componentPanel/summary.svg";
  };

  const escapePy = (val) => {
    if (val == null || val === "") return "";
    return String(val).replace(/"/g, '\\"').replace(/\n/g, "\\n");
  };

  useEffect(() => {
    async function executeSummary() {
      if (!pyodide || !code?.trim() || !content?.selectors || !sectionId) {
        setResult(null);
        setIsRunning(false);
        return;
      }

      const s = content.selectors || {};

      const dataLayout = s.dataLayout === "long" || s.dataLayout === "wide" ? s.dataLayout : "wide";
      const valueMode =
        s.valueMode === "quant" || s.valueMode === "qual"
          ? s.valueMode
          : s.dataFormat === "quant" || s.dataFormat === "qual"
            ? s.dataFormat
            : s.dataType === "quant" || s.dataType === "qual"
              ? s.dataType
              : "quant";

      let quantColsStr = "";
      if (dataLayout === "long") {
        quantColsStr = s.valCol != null && s.valCol !== "" ? String(s.valCol) : "";
      } else {
        quantColsStr = Array.isArray(s.colMultiple) ? s.colMultiple.join(",") : "";
      }

      if (!quantColsStr) {
        setResult(null);
        setIsRunning(false);
        return;
      }

      const variablesCode = `
quantCols = "${escapePy(quantColsStr)}"
groupVariable = "${escapePy(s.groupVariable || "")}"
dataType = "${escapePy(valueMode)}"
`;

      setIsRunning(true);
      setError(null);
      setResult(null);

      try {
        const funcName = `run_summary_${sectionId.replace(
          /[^a-zA-Z0-9_]/g,
          "_",
        )}`;

        const pythonCode = `
import json
import numpy as np
import pandas as pd
${DATAFRAME_SAFETY_PYTHON}

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

# Safe defaults
quantCols = ""
groupVariable = ""
dataType = "quant"

# Inject selectors
${variablesCode || "# No selectors provided"}

def ${funcName}():
${
  "    " + (code || "").trim().replace(/\n/g, "\n    ") ||
  "    raise ValueError('No summary code provided')"
}
    
    if 'result' in locals() and isinstance(result, dict):
        return json.dumps(to_native(result))
    else:
        return json.dumps({
            "success": False,
            "message": "Code did not produce a 'result' dictionary"
        })

${funcName}()
`.trim();

        const returned = await pyodide.runPythonAsync(pythonCode);

        if (typeof returned === "string" && returned.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(returned);
            setResult(parsed);
          } catch (parseErr) {
            setError(`JSON parse failed: ${parseErr.message}`);
          }
        } else {
          setError("Python did not return valid JSON string");
        }
      } catch (err) {
        console.error(`[Render ${sectionId}] Execution failed:`, err);
        setError(`Python error: ${err.message || err}`);
      } finally {
        setIsRunning(false);
      }
    }

    executeSummary();
  }, [pyodide, code, content?.selectors, sectionId, content?.type]);

  // ── Rendering ─────────────────────────────────────────────────────────────
  if (isRunning) {
    return (
      <Message icon>
        <Icon name="circle notched" loading />
        <Message.Content>Computing summary...</Message.Content>
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
              "dataJournal.statistics.emptyState.title",
              {},
              { default: "Your summary is ready to be configured" },
            )}
          </div>
          <img
            src={getStatisticsEmptyStateImageSrc(summaryType)}
            alt={t(
              "dataJournal.statistics.emptyState.title",
              {},
              { default: "Your summary is ready to be configured" },
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
            "dataJournal.statistics.emptyState.helper",
            {},
            {
              default:
                "Click this component to open the editor, then select columns (and optional grouping) to compute the summary.",
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
        {result.message || "Summary failed – check column selection"}
      </div>
    );
  }

  // ── Success rendering: nice summary tables ────────────────────────────────
  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: "900px",
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h3
        style={{
          textAlign: "center",
          marginBottom: "1.25rem",
          color: "#2d3748",
        }}
      >
        {result.title || "Summary"}
      </h3>

      {/* Overall dataset info */}
      {/* {result.overall && (
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <p style={{ fontSize: "1.1em", color: "#4a5568" }}>
            <strong>{result.overall.n_rows}</strong> rows ×{" "}
            <strong>{result.overall.n_columns}</strong> columns
            {result.overall.n_selected_columns > 0 && (
              <>
                {" "}
                • <strong>{result.overall.n_selected_columns}</strong> selected
                for summary
              </>
            )}
          </p>
        </div>
      )} */}

      {/* Per-column summaries */}
      {result.columns?.map((col, idx) => (
        <div
          key={idx}
          style={{
            marginBottom: "2.5rem",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "1.5rem",
          }}
        >
          <h4 style={{ marginBottom: "0.75rem", color: "#2d3748" }}>
            {col.name}{" "}
            {col.type === "quantitative" ? "(Quantitative)" : "(Categorical)"}
          </h4>

          <Table celled compact definition style={{ marginBottom: "1rem" }}>
            <Table.Body>
              <Table.Row>
                <Table.Cell collapsing style={{ fontWeight: "bold" }}>
                  Valid values
                </Table.Cell>
                <Table.Cell>
                  {col.n_valid} (
                  {(
                    (col.n_valid / (col.n_valid + col.n_missing)) *
                    100
                  ).toFixed(1)}
                  %)
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell collapsing style={{ fontWeight: "bold" }}>
                  Missing
                </Table.Cell>
                <Table.Cell>{col.n_missing}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell collapsing style={{ fontWeight: "bold" }}>
                  Unique values
                </Table.Cell>
                <Table.Cell>{col.unique}</Table.Cell>
              </Table.Row>

              {/* Quantitative stats */}
              {col.type === "quantitative" && (
                <>
                  <Table.Row>
                    <Table.Cell collapsing style={{ fontWeight: "bold" }}>
                      Mean
                    </Table.Cell>
                    <Table.Cell>{col.mean?.toFixed(3) ?? "—"}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell collapsing style={{ fontWeight: "bold" }}>
                      Std. Dev.
                    </Table.Cell>
                    <Table.Cell>{col.std?.toFixed(3) ?? "—"}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell collapsing style={{ fontWeight: "bold" }}>
                      Min / Max
                    </Table.Cell>
                    <Table.Cell>
                      {col.min?.toFixed(3) ?? "—"} /{" "}
                      {col.max?.toFixed(3) ?? "—"}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell collapsing style={{ fontWeight: "bold" }}>
                      Quartiles (Q1 / Median / Q3)
                    </Table.Cell>
                    <Table.Cell>
                      {col["25%"]?.toFixed(3) ?? "—"} /{" "}
                      {col["50%"]?.toFixed(3) ?? "—"} /{" "}
                      {col["75%"]?.toFixed(3) ?? "—"}
                    </Table.Cell>
                  </Table.Row>
                </>
              )}

              {/* Categorical top values */}
              {col.type !== "quantitative" &&
                col.top_categories?.length > 0 && (
                  <Table.Row>
                    <Table.Cell collapsing style={{ fontWeight: "bold" }}>
                      Top categories
                    </Table.Cell>
                    <Table.Cell>
                      <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                        {col.top_categories.map((cat, i) => (
                          <li key={i}>
                            {cat.category}: {cat.count} (
                            {cat.percent.toFixed(1)}%)
                          </li>
                        ))}
                      </ul>
                    </Table.Cell>
                  </Table.Row>
                )}
            </Table.Body>
          </Table>

          {/* Grouped summary (if available) */}
          {col.grouped?.length > 0 && (
            <Table celled compact style={{ marginTop: "1rem" }}>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Group</Table.HeaderCell>
                  <Table.HeaderCell>N</Table.HeaderCell>
                  <Table.HeaderCell>Mean</Table.HeaderCell>
                  <Table.HeaderCell>SD</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {col.grouped.map((g, i) => (
                  <Table.Row key={i}>
                    <Table.Cell>{g.group}</Table.Cell>
                    <Table.Cell>{g.n}</Table.Cell>
                    <Table.Cell>{g.mean?.toFixed(3) ?? "—"}</Table.Cell>
                    <Table.Cell>{g.std?.toFixed(3) ?? "—"}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </div>
      ))}

      {/* Footer note */}
      {/* <p
        style={{
          textAlign: "center",
          color: "#718096",
          fontSize: "0.95em",
          marginTop: "2rem",
        }}
      >
        Summary based on selected columns. Missing values excluded from
        calculations.
      </p> */}
    </div>
  );
}
