import { useEffect } from "react";

export default function Render({ data, code, pyodide, runCode, sectionId }) {
  const prepareCanvasCode = `# get relevant html elements
plot_output = js.document.getElementById('figure-${sectionId}')
X = js.document.getElementById("X-variable-${sectionId}").value
Y = js.document.getElementById("Y-variable-${sectionId}").value
Group = js.document.getElementById("Group-variable-${sectionId}").value`;

  // run only once to connect selectors with python code
  useEffect(() => {
    async function startPyodide() {
      await pyodide.runPythonAsync(prepareCanvasCode);
    }
    startPyodide();
  }, []);

  // run if the data has changed
  useEffect(() => {
    async function evaluatePython() {
      await runCode({ code });
    }
    evaluatePython();
  }, [data]);

  return <div className="graphArea" id={`figure-${sectionId}`} />;
}
