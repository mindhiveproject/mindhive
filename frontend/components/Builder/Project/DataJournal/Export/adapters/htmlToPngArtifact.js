/**
 * Render HTML string to PNG artifact (for tables / paragraphs in PDF).
 *
 * @param {string} html
 * @param {number} width
 * @param {number} height
 * @returns {Promise<import('../widgetArtifact').WidgetExportArtifact | null>}
 */
export async function htmlToPngArtifact(html, width, height) {
  if (typeof document === "undefined") return null;
  if (!html?.trim()) return null;

  const safeW = Math.max(1, Math.round(width));
  const safeH = Math.max(1, Math.round(height));

  const host = document.createElement("div");
  host.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${safeW}px`,
    "max-height:none",
    "overflow:visible",
    "background:#ffffff",
    "padding:8px",
    "box-sizing:border-box",
    "font-family:Inter,sans-serif",
    "font-size:12px",
    "line-height:1.4",
    "color:#171717",
  ].join(";");

  const inner = document.createElement("div");
  inner.innerHTML = html;
  host.appendChild(inner);
  document.body.appendChild(host);

  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(host, {
      backgroundColor: "#ffffff",
      scale: Math.min(2, window.devicePixelRatio || 1),
      useCORS: true,
      logging: false,
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
      usedFallback: false,
      source: "native",
    };
  } catch (err) {
    console.error("htmlToPngArtifact:", err);
    return null;
  } finally {
    document.body.removeChild(host);
  }
}
