import { useEffect } from "react";

export default function Render({ data, code, pyodide, runCode, sectionId }) {
  const prepareCanvasCode = `
# get relevant html elements
html_output = js.document.getElementById('figure-${sectionId}')

dataFormat= None if js.document.getElementById("dataFormat-${sectionId}") == None else js.document.getElementById("dataFormat-${sectionId}").value
isWide = dataFormat == "wide"

if isWide: 
  col1 = None if js.document.getElementById("col1-${sectionId}") == None else js.document.getElementById("col1-${sectionId}").value
  col2 = None if js.document.getElementById("col2-${sectionId}") == None else js.document.getElementById("col2-${sectionId}").value

  colMultiple = None if js.document.getElementById("colToAnalyse-${sectionId}") == None else js.document.getElementById("colToAnalyse-${sectionId}")
  if colMultiple:
    colMultiple_json = colMultiple.value.split(",")
    columns = colMultiple_json

else: 
  quantCol = None if js.document.getElementById("valCol-${sectionId}") == None else js.document.getElementById("valCol-${sectionId}").value
  groupcol = None if js.document.getElementById("groupcol-${sectionId}") == None else js.document.getElementById("groupcol-${sectionId}").value
`;

  // run to connect output and selectors with python code
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
