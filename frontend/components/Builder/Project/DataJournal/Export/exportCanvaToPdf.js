import { buildCanvasExportManifest } from "./buildCanvasExportManifest";
import { composeTiledPdf } from "./composeTiledPdf";
import { exportWidgetArtifact } from "./adapters";
import { FIGURE_READY_TYPES, UNSUPPORTED_EXPORT_TYPES } from "./constants";

/**
 * @typedef {'idle'|'preparing'|'rendering'|'composing'|'saving'|'done'|'error'} ExportPhase
 */

/**
 * Check whether all figure widgets are ready for export.
 *
 * @param {Array<{ id: string; type: string }>} components
 * @param {Record<string, boolean>} figureReadinessByComponentId
 */
export function getExportReadinessIssues(
  components,
  figureReadinessByComponentId,
) {
  const notReady = [];
  components.forEach((comp) => {
    if (!FIGURE_READY_TYPES.has(comp.type)) return;
    const id = typeof comp.id === "string" ? comp.id.trim() : "";
    if (!id) return;
    if (figureReadinessByComponentId?.[id] !== true) {
      notReady.push(comp);
    }
  });
  return notReady;
}

/**
 * @param {{
 *   canvasElement: HTMLElement;
 *   layout: unknown[];
 *   components: Array<{ id: string; type: string; title?: string; content?: object }>;
 *   gridWidth: number;
 *   onProgress?: (phase: string, detail?: object) => void;
 * }} params
 */
export async function exportCanvaToPdf({
  canvasElement,
  layout,
  components,
  gridWidth,
  onProgress,
}) {
  onProgress?.("preparing");

  const manifest = buildCanvasExportManifest({
    canvasElement,
    layout,
    components,
    gridWidth,
  });

  if (!manifest?.items?.length) {
    throw new Error("EXPORT_EMPTY_CANVAS");
  }

  const componentsById = new Map(
    components.map((c) => [String(c.id), c]),
  );

  const artifactsByComponentId = new Map();
  const warnings = [];

  onProgress?.("rendering", { total: manifest.items.length });

  for (const manifestItem of manifest.items) {
    if (UNSUPPORTED_EXPORT_TYPES.has(manifestItem.type)) {
      warnings.push({
        componentId: manifestItem.componentId,
        type: manifestItem.type,
        reason: "unsupported_type",
      });
      continue;
    }

    const component = componentsById.get(manifestItem.componentId);
    const artifact = await exportWidgetArtifact({
      manifestItem,
      component: component || { content: {} },
    });

    if (!artifact) {
      warnings.push({
        componentId: manifestItem.componentId,
        type: manifestItem.type,
        reason: "export_failed",
      });
      continue;
    }

    if (artifact.usedFallback) {
      warnings.push({
        componentId: manifestItem.componentId,
        type: manifestItem.type,
        reason: "raster_fallback",
      });
    }

    artifactsByComponentId.set(manifestItem.componentId, artifact);
  }

  onProgress?.("composing");

  const { pdfBytes, previewPngBytes, pageCount } = await composeTiledPdf(
    manifest,
    artifactsByComponentId,
  );

  const pdfFile = new File([pdfBytes], "canva-export.pdf", {
    type: "application/pdf",
  });

  let previewFile = null;
  if (previewPngBytes) {
    previewFile = new File([previewPngBytes], "canva-export-preview.png", {
      type: "image/png",
    });
  }

  return {
    manifest,
    pdfFile,
    previewFile,
    pageCount,
    warnings,
  };
}
