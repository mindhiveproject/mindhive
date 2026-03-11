// components/DataJournal/Widgets/types/Code/Render.js
import { useEffect, useState } from "react";
import { Message, Icon } from "semantic-ui-react";

export default function Render({ content, sectionId, pyodide, code }) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function executeCode() {
      if (!pyodide || !sectionId || !code?.trim()) {
        setResult(null);
        setError(null);
        setIsRunning(false);
        return;
      }

      setIsRunning(true);
      setError(null);
      setResult(null);

      try {
        const funcName = `run_code_${sectionId.replace(/[^a-zA-Z0-9_]/g, "_")}`;

        const pythonCode = `
import json
import sys
from io import StringIO
from contextlib import redirect_stdout, redirect_stderr

def ${funcName}():
    # Buffers for stdout and stderr
    stdout_buffer = StringIO()
    stderr_buffer = StringIO()

    # User code is expected to set a variable named \`result\`
    # OR explicitly \`return\` a JSON-serializable object / JSON string.
    user_result = None

    try:
        with redirect_stdout(stdout_buffer), redirect_stderr(stderr_buffer):
${"            " + code.trim().replace(/\n/g, "\n            ")}

            # If user code defined \`result\`, pick it up
            if 'result' in locals():
                user_result = result

    except Exception as e:
        # Capture exception message in stderr
        import traceback
        traceback.print_exc(file=stderr_buffer)
        return json.dumps({
            "success": False,
            "message": "Python exception during execution",
            "stdout": stdout_buffer.getvalue(),
            "stderr": stderr_buffer.getvalue(),
        })

    stdout_val = stdout_buffer.getvalue()
    stderr_val = stderr_buffer.getvalue()

    # If user_result is a string that looks like JSON, keep it as is
    if isinstance(user_result, str):
        try:
            parsed = json.loads(user_result)
            payload = {
                "success": True,
                "result": parsed,
            }
        except Exception:
            # Treat plain string as the main result
            payload = {
                "success": True,
                "result": user_result,
            }
    else:
        # Dump any JSON-serializable Python object
        try:
            payload = {
                "success": True,
                "result": user_result,
            }
        except TypeError:
            payload = {
                "success": False,
                "message": "Result is not JSON serializable",
                "result": None,
            }

    payload["stdout"] = stdout_val
    payload["stderr"] = stderr_val

    return json.dumps(payload)

${funcName}()
`.trim();

        const returned = await pyodide.runPythonAsync(pythonCode);

        if (typeof returned === "string") {
          try {
            const parsed = JSON.parse(returned);
            setResult(parsed);
          } catch (parseErr) {
            // Not valid JSON; show raw string as stdout-like output
            setResult({
              success: false,
              message: "Python did not return valid JSON",
              stdout: returned,
              stderr: "",
              result: null,
            });
          }
        } else {
          setResult({
            success: true,
            message: "Non-string return value from Python",
            result: returned,
            stdout: "",
            stderr: "",
          });
        }
      } catch (err) {
        console.error(`[Code Render ${sectionId}] Execution failed:`, err);
        setError(`Python error: ${err.message || err}`);
      } finally {
        setIsRunning(false);
      }
    }

    executeCode();
  }, [pyodide, code, sectionId, content?.type]);

  // ── Rendering ─────────────────────────────────────────────────────────────

  if (isRunning) {
    return (
      <Message icon>
        <Icon name="circle notched" loading />
        <Message.Content>Running code...</Message.Content>
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
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
        }}
      >
        {error}
      </div>
    );
  }

  if (!code?.trim()) {
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
        Type some Python code in the editor to see output here.
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const { success, message, stdout, stderr, result: payload } = result;

  return (
    <div style={{ padding: "1rem", fontSize: "0.9rem" }}>
      {/* Status / message */}
      {(success === false || message) && (
        <div
          style={{
            marginBottom: "0.75rem",
            fontFamily: "system-ui, sans-serif",
            color: success === false ? "#c53030" : "#2d3748",
            fontWeight: "bold",
          }}
        >
          {message ||
            (success === false ? "Execution failed" : "Execution result")}
        </div>
      )}

      {/* Stdout */}
      {stdout && (
        <div
          style={{
            marginBottom: "0.75rem",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            background: "#f7fafc",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            padding: "0.75rem",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#4a5568",
              marginBottom: "0.25rem",
            }}
          >
            STDOUT
          </div>
          {stdout}
        </div>
      )}

      {/* Stderr */}
      {stderr && (
        <div
          style={{
            marginBottom: "0.75rem",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            background: "#fff5f5",
            borderRadius: "6px",
            border: "1px solid #fed7d7",
            padding: "0.75rem",
            color: "#c53030",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#9b2c2c",
              marginBottom: "0.25rem",
            }}
          >
            STDERR
          </div>
          {stderr}
        </div>
      )}

      {/* JSON result */}
      {payload !== undefined && (
        <div
          style={{
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            background: "#edf2f7",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            padding: "0.75rem",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#4a5568",
              marginBottom: "0.25rem",
            }}
          >
            RESULT
          </div>
          <pre style={{ margin: 0 }}>{JSON.stringify(payload, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
