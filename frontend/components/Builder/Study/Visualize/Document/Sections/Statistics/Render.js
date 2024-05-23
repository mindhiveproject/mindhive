import { useEffect } from "react";

export default function Render({ data, code, pyodide, runCode, sectionId }) {
  const prepareCode = `
html_output = js.document.getElementById('figure-${sectionId}')

colMultiple = None if js.document.getElementById("colMultiple-${sectionId}") == None else js.document.getElementById("colMultiple-${sectionId}")
if colMultiple != None:
    colMultiple_json = colMultiple.value.split(",")
    columns = colMultiple_json
else:
    columns = None

groupVariable= None if js.document.getElementById("groupVariable-${sectionId}") == None else js.document.getElementById("groupVariable-${sectionId}").value

dataType= None if js.document.getElementById("dataType-${sectionId}") == None else js.document.getElementById("dataType-${sectionId}").value

isQuant = dataType == "quant"
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
