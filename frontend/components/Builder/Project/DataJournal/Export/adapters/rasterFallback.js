import { captureDomToPng } from "./captureDomToPng";

/**
 * Find the best element to capture inside a widget.
 *
 * @param {HTMLElement} root
 * @returns {HTMLElement | null}
 */
function findWidgetCaptureTarget(root, selector) {
  if (!root) return null;
  if (selector) {
    const match = root.querySelector(selector);
    if (match) return match;
  }
  return root.querySelector(".widget-content-handle") || root;
}

/**
 * Rasterize a widget DOM node to PNG via html2canvas (full scrollable content).
 *
 * @param {string} componentId
 * @param {{ width?: number; height?: number; selector?: string }} [opts]
 * @returns {Promise<import('../widgetArtifact').WidgetExportArtifact | null>}
 */
export async function rasterizeWidgetElement(componentId, opts = {}) {
  if (typeof document === "undefined") return null;

  const root = document.querySelector(`[data-widget-id="${componentId}"]`);
  if (!root) return null;

  const contentEl = findWidgetCaptureTarget(root, opts.selector);
  const targetWidth =
    opts.width || contentEl.getBoundingClientRect().width || 400;

  if (targetWidth <= 0) return null;

  return captureDomToPng(contentEl, {
    targetWidth,
    meta: { usedFallback: true, source: "raster" },
  });
}
