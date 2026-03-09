// components/DataJournal/Widgets/types/StatisticTest/Render.js
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
    async function executeTest() {
      if (!pyodide || !code?.trim() || !content?.selectors || !sectionId) {
        setResult(null);
        setIsRunning(false);
        return;
      }

      const s = content.selectors || {};
      const type = content.type || "tTest"; // note: case sensitive

      let variablesCode = "";
      let hasRequired = true;

      if (type === "tTest" || type === "oneWayAnova") {
        const isWide = s.dataFormat === "wide";

        let required = [];
        if (isWide) {
          if (type === "tTest") {
            required = ["col1", "col2"];
          } else {
            // anova
            required = ["colToAnalyse"];
          }
        } else {
          required = ["valCol", "groupcol"];
        }

        hasRequired = required.every((key) => !!s[key]);

        if (!hasRequired) {
          setResult(null);
          setIsRunning(false);
          return;
        }

        variablesCode = `
isWide = ${isWide ? "True" : "False"}
dataFormat = "${escapePy(s.dataFormat || "long")}"
        `;

        if (isWide) {
          if (type === "tTest") {
            variablesCode += `
col1 = "${escapePy(s.col1 || "")}"
col2 = "${escapePy(s.col2 || "")}"
            `;
          } else {
            variablesCode += `
colToAnalyse = "${escapePy(s.colToAnalyse || "")}"
            `;
          }
        } else {
          variablesCode += `
quantCol = "${escapePy(s.valCol || "")}"
groupcol = "${escapePy(s.groupcol || "")}"
          `;
        }
      }

      setIsRunning(true);
      setError(null);
      setResult(null);

      try {
        const funcName = `run_test_${sectionId.replace(/[^a-zA-Z0-9_]/g, "_")}`;

        const pythonCode = `
import json
import numpy as np

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
isWide = False
dataFormat = "long"
col1 = col2 = quantCol = groupcol = colToAnalyse = ""

# Inject selectors
${variablesCode || "# No selectors provided"}

def ${funcName}():
${
  "    " + (code || "").trim().replace(/\n/g, "\n    ") ||
  "    raise ValueError('No code provided')"
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

    executeTest();
  }, [pyodide, code, content?.selectors, sectionId, content?.type]);

  // ── Rendering ─────────────────────────────────────────────────────────────
  if (isRunning) {
    return (
      <Message icon>
        <Icon name="circle notched" loading />
        <Message.Content>Computing...</Message.Content>
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
        Select variables in the editor panel to compute the test
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
        {result.message || "Test failed – check variable selection"}
      </div>
    );
  }

  // ── Success rendering (works for both tTest and anova) ────────────────────
  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: "800px",
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
        {result.title || "Statistical Test Result"}
      </h3>

      {/* Groups descriptive statistics */}
      {result.groups?.length > 0 && (
        <Table celled compact structured style={{ marginBottom: "1.5rem" }}>
          <Table.Header>
            <Table.Row style={{ background: "#f7fafc" }}>
              <Table.HeaderCell>Group</Table.HeaderCell>
              <Table.HeaderCell>N</Table.HeaderCell>
              <Table.HeaderCell>Mean</Table.HeaderCell>
              <Table.HeaderCell>SD</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {result.groups.map((g, i) => (
              <Table.Row key={i}>
                <Table.Cell>{g.name ?? "—"}</Table.Cell>
                <Table.Cell>{g.n ?? "—"}</Table.Cell>
                <Table.Cell>{g.mean?.toFixed(3) ?? "—"}</Table.Cell>
                <Table.Cell>{g.sd?.toFixed(3) ?? "—"}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {/* Test statistics */}
      <Table celled compact definition>
        <Table.Body>
          {/* ANOVA-specific */}
          {result.f_stat !== undefined && (
            <Table.Row>
              <Table.Cell collapsing style={{ fontWeight: "bold" }}>
                F-statistic
              </Table.Cell>
              <Table.Cell>{result.f_stat.toFixed(2)}</Table.Cell>
            </Table.Row>
          )}

          {result.df_between !== undefined &&
            result.df_within !== undefined && (
              <Table.Row>
                <Table.Cell collapsing style={{ fontWeight: "bold" }}>
                  Degrees of freedom
                </Table.Cell>
                <Table.Cell>
                  between: {result.df_between}, within: {result.df_within}
                </Table.Cell>
              </Table.Row>
            )}

          {/* t-test specific */}
          {result.t_stat !== undefined && (
            <Table.Row>
              <Table.Cell collapsing style={{ fontWeight: "bold" }}>
                t-statistic
              </Table.Cell>
              <Table.Cell>{result.t_stat.toFixed(3)}</Table.Cell>
            </Table.Row>
          )}

          {result.df !== undefined && (
            <Table.Row>
              <Table.Cell collapsing style={{ fontWeight: "bold" }}>
                df
              </Table.Cell>
              <Table.Cell>{result.df}</Table.Cell>
            </Table.Row>
          )}

          {/* Common */}
          {result.p_value !== undefined && (
            <Table.Row>
              <Table.Cell collapsing style={{ fontWeight: "bold" }}>
                p-value
              </Table.Cell>
              <Table.Cell
                style={{
                  fontWeight: result.significant ? "bold" : "normal",
                  color: result.significant ? "#c53030" : "inherit",
                }}
              >
                {result.p_value.toFixed(4)}
                {result.significant ? " *" : ""}
              </Table.Cell>
            </Table.Row>
          )}

          {result.cohens_d !== undefined && (
            <Table.Row>
              <Table.Cell collapsing style={{ fontWeight: "bold" }}>
                Cohen's d
              </Table.Cell>
              <Table.Cell>{result.cohens_d.toFixed(3)}</Table.Cell>
            </Table.Row>
          )}

          {result.eta_squared !== undefined && (
            <Table.Row>
              <Table.Cell collapsing style={{ fontWeight: "bold" }}>
                Partial η²
              </Table.Cell>
              <Table.Cell>{result.eta_squared.toFixed(3)}</Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>

      {/* Interpretation */}
      {result.interpretation && (
        <p
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            lineHeight: "1.6",
            color: "#2d3748",
          }}
          dangerouslySetInnerHTML={{ __html: result.interpretation }}
        />
      )}

      {/* Significance footnote */}
      {result.significant && (
        <p
          style={{
            fontSize: "0.85em",
            color: "#718096",
            textAlign: "center",
            marginTop: "1rem",
          }}
        >
          * p &lt; 0.05, ** p &lt; 0.01, *** p &lt; 0.001
        </p>
      )}
    </div>
  );
}
