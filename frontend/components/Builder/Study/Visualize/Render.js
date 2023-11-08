import { useEffect, useState } from "react";

import { loadPyodide } from "pyodide";


// http://mpld3.github.io

const sampleData = {
  x: [20, 30, 40, 50],
  y: [1, 2, 3, 4]
}

// import js_workspace
// data = js_workspace.to_py()
// df = pd.DataFrame(data = data)
// print(df)


export default function Render({ data, spec }) {

  const [pyodide, setPyodide] = useState(false);
  // const [running, setRunning] = useState(false);
  
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
        pyodide.registerJsModule("js_workspace", sampleData);
        // setRunning(true);
        const res = await pyodide.runPythonAsync(code);
        console.log(res);
        return res;
      }
    }
    evaluatePython(spec);
  }, [spec, pyodide])

  return (
    <div className="graphArea" id="figureArea"/>
  );
}