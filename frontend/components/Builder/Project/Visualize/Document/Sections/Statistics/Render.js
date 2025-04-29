import { useEffect } from "react";

export default function Render({ data, code, pyodide, runCode, sectionId }) {
  const prepareCode = `
html_output = js.document.getElementById('figure-${sectionId}')
parameters = dict(json.loads('dashboardJSON'))
print("Py code parameters", parameters)
  `;

  // run to connect plot output and selectors with python code
  useEffect(() => {
    async function startPyodide() {
      await pyodide.runPythonAsync(prepareCode);
    }
    startPyodide();
  }, [data, code]);

  // run if the data has changed
  useEffect(() => {
    async function evaluatePython() {
      await runCode({ code });
    }
    evaluatePython();
  }, [data, code]);

  return <div className="graphArea" id={`figure-${sectionId}`} />;
}
