// components/DataJournal/Helpers/PyodideUtils.js
import { loadPyodide } from "pyodide";

export const baseCode = `import js
import micropip
import pandas as pd
import numpy as np
await micropip.install('plotly==5.20.0')
await micropip.install('statsmodels')
import plotly.express as px
import plotly.graph_objects as go
import json`;

export function render_html(container, html) {
  var range = document.createRange();
  range.selectNode(container);
  var documentFragment = range.createContextualFragment(html);
  while (container.hasChildNodes()) {
    container.removeChild(container.firstChild);
  }
  container.appendChild(documentFragment);
}

export const initializePyodide = async () => {
  const pyodideLoad = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
  });
  await pyodideLoad.loadPackage([
    "numpy",
    "pandas",
    "micropip",
    "scipy",
    "matplotlib",
  ]);
  await pyodideLoad.runPythonAsync(baseCode);
  window.render_html = render_html; // Global if needed -> Might be removed later?
  return pyodideLoad;
};

// TODO OUTDATED - REMOVE LATER
export const runCode = async (pyodide, code) => {
  console.log("CODE FROM UTILS");
  if (!pyodide) {
    throw new Error("Pyodide is not initialized");
  }
  try {
    const result = await pyodide.runPythonAsync(code);
    return result;
  } catch (err) {
    console.error("Python execution error:", err);
    throw err; // Rethrow for caller handling
  }
};
