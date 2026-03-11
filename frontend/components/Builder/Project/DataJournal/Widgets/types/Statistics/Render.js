// components/DataJournal/Widgets/types/Statistics/Render.js
import { useEffect, useState } from "react";
import { Message, Icon, Table } from "semantic-ui-react";

export default function Render({ code, pyodide, sectionId, content }) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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

      // For summary: we expect quantCols (comma-separated), groupVariable, dataType
      let variablesCode = "";
      let hasRequired = !!s.colMultiple; // minimal requirement

      if (!hasRequired) {
        setResult(null);
        setIsRunning(false);
        return;
      }

      variablesCode = `
quantCols = "${escapePy(s.colMultiple?.join(",") || "")}"
groupVariable = "${escapePy(s.groupVariable || "")}"
dataType = "${escapePy(s.dataFormat || "quant")}"
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
        Select columns (and optional grouping variable) in the editor panel to
        compute summary
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
        {result.title || "Dataset Summary"}
      </h3>

      {/* Overall dataset info */}
      {result.overall && (
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
      )}

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
      <p
        style={{
          textAlign: "center",
          color: "#718096",
          fontSize: "0.95em",
          marginTop: "2rem",
        }}
      >
        Summary based on selected columns. Missing values excluded from
        calculations.
      </p>
    </div>
  );
}
