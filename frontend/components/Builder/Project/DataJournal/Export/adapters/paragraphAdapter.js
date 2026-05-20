import { htmlArtifact } from "../widgetArtifact";
import { captureDomToPng } from "./captureDomToPng";
import { htmlToPngArtifact } from "./htmlToPngArtifact";

/**
 * @param {{ content: object }} params
 */
export function buildParagraphHtml({ content }) {
  const text = typeof content?.text === "string" ? content.text : "";
  return text.trim() ? text : "<p></p>";
}

/**
 * @param {{ content: object; rect: { width: number; height: number }; componentId: string }} params
 */
export async function exportParagraphWidget({ content, rect, componentId }) {
  const width = Math.max(1, Math.round(rect.width));

  if (componentId && typeof document !== "undefined") {
    const root = document.querySelector(`[data-widget-id="${componentId}"]`);
    const proseMirror = root?.querySelector(".paragraph .ProseMirror");
    if (proseMirror) {
      const domCapture = await captureDomToPng(proseMirror, {
        targetWidth: width,
        meta: { usedFallback: false, source: "native" },
      });
      if (domCapture) return domCapture;
    }

    const paragraphEl = root?.querySelector(".paragraph");
    if (paragraphEl) {
      const fallbackCapture = await captureDomToPng(paragraphEl, {
        targetWidth: width,
        meta: { usedFallback: true, source: "raster" },
      });
      if (fallbackCapture) return fallbackCapture;
    }
  }

  const html = buildParagraphHtml({ content });
  const png = await htmlToPngArtifact(html, width, rect.height);
  if (png) return png;

  return htmlArtifact(html, width, rect.height);
}
