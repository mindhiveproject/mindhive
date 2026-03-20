export function figHtmlStringFromPyodide(pyodide) {
  if (!pyodide?.globals) return "";
  const raw = pyodide.globals.get("fig_html");
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw.toJs === "function") {
    const v = raw.toJs();
    return typeof v === "string" ? v : String(v);
  }
  return String(raw.toString?.() ?? raw);
}
