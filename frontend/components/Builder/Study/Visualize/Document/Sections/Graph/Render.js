import { useEffect } from "react";

export default function Render({ data, code, pyodide, runCode, sectionId }) {
  const prepareCanvasCode = `# get relevant html elements
plot_output = js.document.getElementById('figure-${sectionId}')
X = js.document.getElementById("X-variable-${sectionId}").value
Y = js.document.getElementById("Y-variable-${sectionId}").value
Group = js.document.getElementById("Group-variable-${sectionId}").value
graphTitle = js.document.getElementById('graphTitle-${sectionId}').value
xLabel = js.document.getElementById('xLabel-${sectionId}').value
xRangeMin = js.document.getElementById('xRangeMin-${sectionId}').value
xRangeMax = js.document.getElementById('xRangeMax-${sectionId}').value
yLabel = js.document.getElementById('yLabel-${sectionId}').value
yRangeMin = js.document.getElementById('yRangeMin-${sectionId}').value
yRangeMax = js.document.getElementById('yRangeMax-${sectionId}').value
marginalPlot = js.document.getElementById('marginalPlot-${sectionId}').value`;

  // run only once to connect selectors with python code
  useEffect(() => {
    async function startPyodide() {
      await pyodide.runPythonAsync(prepareCanvasCode);
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
