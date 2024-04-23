import { useEffect } from "react";

export default function Render({ data, code, pyodide, runCode, sectionId }) {
  const prepareCanvasCode = `
# get relevant html elements
html_output = js.document.getElementById('figure-${sectionId}')

Xmultiple = js.document.getElementById("xVariableMultiple-${sectionId}")

X     = None if js.document.getElementById("xVariable-${sectionId}")     == None else js.document.getElementById("xVariable-${sectionId}").value
Y     = None if js.document.getElementById("yVariable-${sectionId}")     == None else js.document.getElementById("yVariable-${sectionId}").value
col1     = None if js.document.getElementById("col1-${sectionId}")     == None else js.document.getElementById("col1-${sectionId}").value
col2     = None if js.document.getElementById("col2-${sectionId}")     == None else js.document.getElementById("col2-${sectionId}").value
Group = None if js.document.getElementById("groupVariable-${sectionId}") == None else js.document.getElementById("groupVariable-${sectionId}").value

NumericalColumn  = None if js.document.getElementById("NumericalColumn-${sectionId}") == None else js.document.getElementById("NumericalColumn-${sectionId}").value
StringColumn  = None if js.document.getElementById("StringColumn-${sectionId}") == None else js.document.getElementById("StringColumn-${sectionId}").value
LabelColumn      = None if js.document.getElementById("LabelColumn-${sectionId}")     == None else js.document.getElementById("LabelColumn-${sectionId}").value

graphTitle = None if js.document.getElementById('graphTitle-${sectionId}') == None else js.document.getElementById('graphTitle-${sectionId}').value

legend_title = None if js.document.getElementById('legend_title-${sectionId}') == None else js.document.getElementById('legend_title-${sectionId}').value
x_labels     = None if js.document.getElementById('x_labels-${sectionId}') == None else js.document.getElementById('x_labels-${sectionId}').value

xLabel    = None if js.document.getElementById('xLabel-${sectionId}') == None else js.document.getElementById('xLabel-${sectionId}').value
xRangeMin = None if js.document.getElementById('xRangeMin-${sectionId}') == None else js.document.getElementById('xRangeMin-${sectionId}').value
xRangeMax = None if js.document.getElementById('xRangeMax-${sectionId}') == None else js.document.getElementById('xRangeMax-${sectionId}').value

yLabel    = None if js.document.getElementById('yLabel-${sectionId}') == None else js.document.getElementById('yLabel-${sectionId}').value
yRangeMin = None if js.document.getElementById('yRangeMin-${sectionId}') == None else js.document.getElementById('yRangeMin-${sectionId}').value
yRangeMax = None if js.document.getElementById('yRangeMax-${sectionId}') == None else js.document.getElementById('yRangeMax-${sectionId}').value

color        = 'pink' if js.document.getElementById('color-${sectionId}') == None else js.document.getElementById('color-${sectionId}').value
marginalPlot = None if js.document.getElementById('marginalPlot-${sectionId}') == None else js.document.getElementById('marginalPlot-${sectionId}').value`;

  // run to connect plot output and selectors with python code
  useEffect(() => {
    async function startPyodide() {
      // debugger;
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
