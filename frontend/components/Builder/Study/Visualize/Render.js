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


const importString = `
import matplotlib
import matplotlib.pyplot as plt

matplotlib.use("module://matplotlib_pyodide.html5_canvas_backend");

f = plt.figure(1)

from js import document
def create_root_element2(self):
    return document.querySelector('.graphArea')

f.canvas.create_root_element = create_root_element2.__get__(
    create_root_element2, f.canvas.__class__)
`

export default function Render({ data, spec }) {

  const [pyodide, setPyodide] = useState(false);
  // const [running, setRunning] = useState(false);

  useEffect(() => {
    async function startPyodide() {
      const pyodideLoad = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/"
      });
      await pyodideLoad.loadPackage(["numpy", "pandas", "matplotlib"]);

      // Import modules and run code that will only run once
      await pyodideLoad.runPython(importString);
      setPyodide(pyodideLoad);
    }
    startPyodide();
  }, []);

  useEffect(() => {
    async function evaluatePython(code) {
      //document.pyodideMplTarget = document.getElementsByClassName('graphArea');
      if (pyodide) {
        pyodide.registerJsModule("js_workspace", data);
        // setRunning(true);
        const res = await pyodide.runPythonAsync(code);
        return res;
      }
    }
    evaluatePython(spec);
  }, [spec, pyodide, data])

  return (
    <div className="graphArea" id="figureArea" />
  );
}