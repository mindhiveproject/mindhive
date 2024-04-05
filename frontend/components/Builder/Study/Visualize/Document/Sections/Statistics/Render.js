import { useEffect } from "react";

export default function Render({ data, code, pyodide, runCode, sectionId }) {
  const prepareHTML = `# get relevant html elements
html_output = js.document.getElementById('html-${sectionId}')`;

  // run to connect html output with python code
  useEffect(() => {
    async function startPyodide() {
      await pyodide.runPythonAsync(prepareHTML);
    }
    startPyodide();
  }, [data, code]);

  // run if the data or code has changed
  useEffect(() => {
    async function evaluatePython() {
      await runCode({ code });
    }
    evaluatePython();
  }, [data, code]);

  return <div className="htmlOutput" id={`html-${sectionId}`} />;
}
