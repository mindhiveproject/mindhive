import { EXPORT_RASTER_SCALE } from "../constants";
import { EXPORT_CONTENT_STYLES } from "../exportContentStyles";
import { fileToPngArtifact } from "../widgetArtifact";

const OVERFLOW_SELECTORS = [
  ".widget-content-handle",
  ".ProseMirror",
  ".tableWrapper",
  ".paragraph",
  ".ui.table",
  ".rdt_Table",
  ".rdt_TableWrapper",
].join(",");

/**
 * Force visible overflow on cloned export nodes so html2canvas captures full content.
 */
function applyExportCloneStyles(clonedDoc) {
  if (!clonedDoc) return;
  clonedDoc.querySelectorAll(OVERFLOW_SELECTORS).forEach((el) => {
    el.style.overflow = "visible";
    el.style.maxHeight = "none";
  });
  clonedDoc.querySelectorAll(".tableWrapper").forEach((el) => {
    el.style.overflowX = "visible";
  });
}

/**
 * Measure content dimensions after layout at target width.
 */
function measureElementContentSize(element, targetWidth) {
  if (!element) return { width: 1, height: 1 };
  const safeW = Math.max(1, Math.round(targetWidth));
  const prevWidth = element.style.width;
  const prevOverflow = element.style.overflow;
  const prevMaxHeight = element.style.maxHeight;

  element.style.width = `${safeW}px`;
  element.style.overflow = "visible";
  element.style.maxHeight = "none";

  const width = Math.max(
    safeW,
    Math.ceil(element.scrollWidth || element.offsetWidth || safeW),
  );
  const height = Math.max(
    1,
    Math.ceil(element.scrollHeight || element.offsetHeight || 1),
  );

  element.style.width = prevWidth;
  element.style.overflow = prevOverflow;
  element.style.maxHeight = prevMaxHeight;

  return { width, height };
}

/**
 * Capture a DOM element to PNG without viewport clipping.
 *
 * @param {HTMLElement} element
 * @param {{ targetWidth: number; meta?: { usedFallback?: boolean; source?: 'native' | 'raster' } }} opts
 * @returns {Promise<import('../widgetArtifact').WidgetExportArtifact | null>}
 */
export async function captureDomToPng(element, opts = {}) {
  if (typeof document === "undefined" || !element) return null;

  const targetWidth = Math.max(1, Math.round(opts.targetWidth || 400));
  const meta = opts.meta || { usedFallback: false, source: "native" };

  measureElementContentSize(element, targetWidth);

  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: EXPORT_RASTER_SCALE,
      useCORS: true,
      logging: false,
      onclone: (_doc, clonedElement) => {
        applyExportCloneStyles(clonedElement?.ownerDocument);
        if (clonedElement) {
          clonedElement.style.overflow = "visible";
          clonedElement.style.maxHeight = "none";
        }
      },
    });

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("toBlob failed"));
      }, "image/png");
    });

    const file = new File([blob], "export-capture.png", { type: "image/png" });
    const artifact = await fileToPngArtifact(file, meta);
    if (artifact) {
      artifact.intrinsicWidth = canvas.width;
      artifact.intrinsicHeight = canvas.height;
    }
    return artifact;
  } catch (err) {
    console.error("captureDomToPng:", err);
    return null;
  }
}

/**
 * Build offscreen host with HTML and export styles.
 *
 * @param {string} html
 * @param {number} targetWidth
 * @returns {{ host: HTMLElement; cleanup: () => void }}
 */
export function createOffscreenExportHost(html, targetWidth) {
  const safeW = Math.max(1, Math.round(targetWidth));

  const host = document.createElement("div");
  host.className = "export-offscreen-host";
  host.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${safeW}px`,
    "overflow:visible",
    "background:#ffffff",
    "padding:8px",
    "box-sizing:border-box",
  ].join(";");

  const styleEl = document.createElement("style");
  styleEl.textContent = EXPORT_CONTENT_STYLES;

  const inner = document.createElement("div");
  inner.className = "export-content-root";
  inner.innerHTML = html;

  host.appendChild(styleEl);
  host.appendChild(inner);
  document.body.appendChild(host);

  return {
    host,
    cleanup: () => {
      if (host.parentNode) host.parentNode.removeChild(host);
    },
  };
}
