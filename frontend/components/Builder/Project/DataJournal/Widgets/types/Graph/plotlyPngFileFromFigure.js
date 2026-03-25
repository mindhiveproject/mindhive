/**
 * Export the Plotly chart in the Data Journal grid (`#figure-{sectionId}`) as a PNG File.
 * Uses the same DOM as react-plotly.js in Graph/Render.js.
 */
const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 720;

function dataUrlToPngFile(dataUrl, fileName) {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png")) {
    return null;
  }
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return null;
  const b64 = dataUrl.slice(comma + 1).replace(/\s/g, "");
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
    typeof fileName === "string" && fileName.trim()
      ? fileName.trim().replace(/[^\w.\- ]+/g, "_")
      : "graph-figure";
  const name = /\.png$/i.test(safe) ? safe : `${safe}.png`;
  return new File([blob], name, { type: "image/png" });
}

/**
 * @param {string} sectionId - VizSection / widget id (matches `figure-${sectionId}` in Graph/Render.js)
 * @param {{ fileName?: string, width?: number, height?: number }} [opts]
 * @returns {Promise<File | null>}
 */
export async function plotlyPngFileFromFigureSection(sectionId, opts = {}) {
  if (typeof sectionId !== "string" || !sectionId.trim()) return null;
  if (typeof document === "undefined") return null;

  const root = document.getElementById(`figure-${sectionId}`);
  if (!root) return null;

  const gd =
    root.querySelector(".js-plotly-plot") ||
    root.querySelector(".plotly") ||
    root.querySelector("[class*='plotly']");
  if (!gd) return null;

  try {
    const PlotlyModule = await import("plotly.js");
    const Plotly = PlotlyModule.default ?? PlotlyModule;
    if (!Plotly?.toImage) return null;

    const width = opts.width ?? DEFAULT_WIDTH;
    const height = opts.height ?? DEFAULT_HEIGHT;

    const dataUrl = await Plotly.toImage(gd, {
      format: "png",
      width,
      height,
    });

    return dataUrlToPngFile(dataUrl, opts.fileName || "graph-figure");
  } catch (err) {
    console.error("plotlyPngFileFromFigureSection:", err);
    return null;
  }
}
