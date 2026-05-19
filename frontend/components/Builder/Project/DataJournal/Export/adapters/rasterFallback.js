/**
 * Rasterize a widget DOM node to PNG via html2canvas.
 *
 * @param {string} componentId
 * @param {{ width?: number; height?: number }} [opts]
 * @returns {Promise<import('../widgetArtifact').WidgetExportArtifact | null>}
 */
export async function rasterizeWidgetElement(componentId, opts = {}) {
  if (typeof document === "undefined") return null;

  const root = document.querySelector(`[data-widget-id="${componentId}"]`);
  if (!root) return null;

  const contentEl =
    root.querySelector(".widget-content-handle") || root;

  const width = opts.width || contentEl.getBoundingClientRect().width || 400;
  const height = opts.height || contentEl.getBoundingClientRect().height || 300;

  if (width <= 0 || height <= 0) return null;

  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(contentEl, {
      backgroundColor: "#ffffff",
      scale: Math.min(2, window.devicePixelRatio || 1),
      useCORS: true,
      logging: false,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
    });

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("toBlob failed"));
      }, "image/png");
    });

    const buffer = new Uint8Array(await blob.arrayBuffer());
    return {
      mimeType: "image/png",
      payload: buffer,
      intrinsicWidth: canvas.width,
      intrinsicHeight: canvas.height,
      usedFallback: true,
      source: "raster",
    };
  } catch (err) {
    console.error("rasterizeWidgetElement:", err);
    return null;
  }
}
