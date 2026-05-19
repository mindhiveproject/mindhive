/**
 * @typedef {'image/png' | 'text/html'} WidgetArtifactMimeType
 */

/**
 * @typedef {Object} WidgetExportArtifact
 * @property {WidgetArtifactMimeType} mimeType
 * @property {Uint8Array | string} payload
 * @property {number} intrinsicWidth
 * @property {number} intrinsicHeight
 * @property {boolean} usedFallback
 * @property {'native' | 'raster'} source
 */

/**
 * @param {File} file
 * @param {{ usedFallback?: boolean; source?: 'native' | 'raster' }} [meta]
 * @returns {Promise<WidgetExportArtifact>}
 */
export async function fileToPngArtifact(file, meta = {}) {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const dims = await readPngDimensions(buffer);
  return {
    mimeType: "image/png",
    payload: buffer,
    intrinsicWidth: dims.width,
    intrinsicHeight: dims.height,
    usedFallback: Boolean(meta.usedFallback),
    source: meta.source || "native",
  };
}

/**
 * @param {string} html
 * @param {number} width
 * @param {number} height
 * @returns {WidgetExportArtifact}
 */
export function htmlArtifact(html, width, height) {
  return {
    mimeType: "text/html",
    payload: html,
    intrinsicWidth: width,
    intrinsicHeight: height,
    usedFallback: false,
    source: "native",
  };
}

async function readPngDimensions(bytes) {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    const width =
      (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const height =
      (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
    if (width > 0 && height > 0) {
      return { width, height };
    }
  }
  return { width: 1, height: 1 };
}
