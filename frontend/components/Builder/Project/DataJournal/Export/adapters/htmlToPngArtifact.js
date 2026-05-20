import {
  captureDomToPng,
  createOffscreenExportHost,
} from "./captureDomToPng";

/**
 * Render HTML string to PNG artifact (for tables / paragraphs in PDF).
 *
 * @param {string} html
 * @param {number} width
 * @param {number} [_height] - unused; content height is measured from layout
 * @returns {Promise<import('../widgetArtifact').WidgetExportArtifact | null>}
 */
export async function htmlToPngArtifact(html, width, _height) {
  if (typeof document === "undefined") return null;
  if (!html?.trim()) return null;

  const safeW = Math.max(1, Math.round(width));
  const { host, cleanup } = createOffscreenExportHost(html, safeW);

  try {
    return await captureDomToPng(host, {
      targetWidth: safeW,
      meta: { usedFallback: false, source: "native" },
    });
  } finally {
    cleanup();
  }
}
