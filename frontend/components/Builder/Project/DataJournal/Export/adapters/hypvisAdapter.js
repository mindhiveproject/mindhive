import { extractPngBase64FromFigHtml } from "../../Widgets/types/HypVis/Editor/Axes/figHtmlFromPyodide";
import { fileToPngArtifact } from "../widgetArtifact";
import { rasterizeWidgetElement } from "./rasterFallback";

/**
 * Extract HypVis PNG from the rendered widget DOM (per-section, not global pyodide).
 *
 * @param {{ componentId: string; rect: { width: number; height: number } }} params
 */
export async function exportHypVisWidget({ componentId, rect }) {
  const exportWidth = Math.max(1, Math.round(rect.width));
  const exportHeight = Math.max(1, Math.round(rect.height));

  const root = document.querySelector(`[data-widget-id="${componentId}"]`);
  if (root) {
    const img = root.querySelector('img[src^="data:image/png"]');
    if (img?.src) {
      const m = img.src.match(/data:image\/png;base64,([A-Za-z0-9+/=\s]+)/);
      if (m?.[1]) {
        try {
          const binary = atob(m[1].replace(/\s+/g, ""));
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: "image/png" });
          const file = new File([blob], "hypvis-export.png", {
            type: "image/png",
          });
          return fileToPngArtifact(file, { source: "native", usedFallback: false });
        } catch {
          /* fall through */
        }
      }
    }

    const htmlHost = root.querySelector(".widget-content-handle");
    const innerHtml = htmlHost?.innerHTML || "";
    const b64 = extractPngBase64FromFigHtml(innerHtml);
    if (b64) {
      try {
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "image/png" });
        const file = new File([blob], "hypvis-export.png", { type: "image/png" });
        return fileToPngArtifact(file, { source: "native", usedFallback: false });
      } catch {
        /* fall through */
      }
    }
  }

  return rasterizeWidgetElement(componentId, {
    width: exportWidth,
    height: exportHeight,
  });
}
