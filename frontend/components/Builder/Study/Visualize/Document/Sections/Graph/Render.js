import { useEffect } from "react";

const prepareCanvasCode = `
import matplotlib
import matplotlib.pyplot as plt

matplotlib.use("module://matplotlib_pyodide.html5_canvas_backend");

f = plt.figure(1)

from js import document
def create_root_element2(self):
    return document.querySelector('.graphArea')

f.canvas.create_root_element = create_root_element2.__get__(
    create_root_element2, f.canvas.__class__)
`;

export default function Render({ data, code, pyodide, runCode }) {
  // run only once
  useEffect(() => {
    async function startPyodide() {
      await pyodide.runPython(prepareCanvasCode);
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

  return <div className="graphArea" id="figureArea" />;
}
