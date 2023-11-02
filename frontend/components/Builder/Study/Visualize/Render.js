// https://vega.github.io/vega/docs/api/view/
// https://vega.github.io/vega-lite/docs/

import { useEffect, useState, useRef } from "react";

import { loadPyodide } from "pyodide";


export default function Render({ data, spec }) {

  const [pyodide, setPyodide] = useState(false);

  const divRef = useRef(null);

  useEffect(() => {
    async function startPyodide() {
      const pyodideLoad = await loadPyodide({
        indexURL : "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/"
      });
      await pyodideLoad.loadPackage(["numpy", "pandas", "matplotlib"]);
      setPyodide(pyodideLoad);
    }
    startPyodide();
  }, []);


  useEffect(() => {
    async function evaluatePython(code) {
      //document.pyodideMplTarget = document.getElementsByClassName('graphArea');
      if (pyodide) {
        const res = await pyodide.runPythonAsync(code);
        console.log(res);
        return res;
      }
    }
    evaluatePython(spec);
  }, [spec])

  return (
    <div className="graphArea" id = "graphDiv"/>
  );
}