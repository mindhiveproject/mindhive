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

const PNG_DATA_URL_RE = /data:image\/png;base64,([A-Za-z0-9+/=\s]+)/;

/**
 * Parses matplotlib `fig_html` when it embeds a PNG data URL (HypVis templates).
 * @param {string} figHtml
 * @returns {string | null} raw base64 (whitespace stripped) or null
 */
export function extractPngBase64FromFigHtml(figHtml) {
  if (typeof figHtml !== "string" || !figHtml.trim()) return null;
  const m = figHtml.match(PNG_DATA_URL_RE);
  if (!m?.[1]) return null;
  const b64 = m[1].replace(/\s+/g, "");
  if (!b64) return null;
  return b64;
}

/**
 * @param {object | null | undefined} pyodide
 * @param {{ fileName?: string }} [opts]
 * @returns {File | null}
 */
export function figPngFileFromPyodide(pyodide, opts = {}) {
  const html = figHtmlStringFromPyodide(pyodide);
  const b64 = extractPngBase64FromFigHtml(html);
  if (!b64) return null;
  let binary;
  try {
    binary = atob(b64);
  } catch {
    return null;
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "image/png" });
  const safe =
    typeof opts.fileName === "string" && opts.fileName.trim()
      ? opts.fileName.trim().replace(/[^\w.\- ]+/g, "_")
      : "hypvis-figure";
  const name = /\.png$/i.test(safe) ? safe : `${safe}.png`;
  return new File([blob], name, { type: "image/png" });
}
