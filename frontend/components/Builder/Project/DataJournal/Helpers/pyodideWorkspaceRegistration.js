import filterData, { renameData } from "./Filter";

/** Matches Journal / widget expectations: register JS rows then build pandas `df`. */
const PREPARE_JS_WORKSPACE_PYTHON = `
import pandas as pd
import js_workspace as data
data = data.to_py()
df = pd.DataFrame(data)
`;

/** Drop cached Python module so the next `import js_workspace` sees the newly registered JS module. */
const CLEAR_JS_WORKSPACE_MODULE_PYTHON = `
import sys
sys.modules.pop("js_workspace", None)
`;

/**
 * Rows passed to `pyodide.registerJsModule("js_workspace", …)` (filtered + displayName keys).
 * @param {{ data?: unknown[]; variables?: unknown[]; settings?: Record<string, unknown> } | null | undefined} slice
 * @returns {unknown[]}
 */
function rowsForPyodideModule(slice) {
  if (!slice) return [];
  const data = Array.isArray(slice.data) ? slice.data : [];
  const variables = Array.isArray(slice.variables) ? slice.variables : [];
  const settings =
    slice.settings && typeof slice.settings === "object" ? slice.settings : {};
  const filtered = filterData({ data, settings });
  return renameData({ data: filtered, variables });
}

/**
 * @param {unknown} pyodide
 * @param {{ data?: unknown[]; variables?: unknown[]; settings?: Record<string, unknown> } | null | undefined} slice
 */
export async function registerJsWorkspaceFromSlice(pyodide, slice) {
  if (!pyodide || !slice) return;
  const rows = rowsForPyodideModule(slice);

  if (typeof pyodide.unregisterJsModule === "function") {
    try {
      pyodide.unregisterJsModule("js_workspace");
    } catch {
      // ignore if module was never registered
    }
  }

  await pyodide.runPythonAsync(CLEAR_JS_WORKSPACE_MODULE_PYTHON);

  pyodide.registerJsModule("js_workspace", [...rows]);
  await pyodide.runPythonAsync(PREPARE_JS_WORKSPACE_PYTHON);
}

/**
 * One shared `js_workspace` / `df` in Pyodide: concurrent widget effects must not
 * interleave register + runPython. Queue work that touches that workspace.
 * @param {() => Promise<unknown>} task
 * @returns {Promise<unknown>}
 */
let jsWorkspaceTaskChain = Promise.resolve();

export function enqueueJsWorkspaceTask(task) {
  const run = () => Promise.resolve().then(() => task());
  const next = jsWorkspaceTaskChain.then(run, run);
  jsWorkspaceTaskChain = next.catch(() => {});
  return next;
}
