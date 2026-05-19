import { exportGraphWidget } from "./graphAdapter";
import { exportHypVisWidget } from "./hypvisAdapter";
import { exportParagraphWidget } from "./paragraphAdapter";
import { rasterizeWidgetElement } from "./rasterFallback";
import { exportTableWidget } from "./tableAdapter";
import { htmlToPngArtifact } from "./htmlToPngArtifact";
/**
 * Normalize any artifact to PNG bytes for PDF embedding.
 *
 * @param {import('../widgetArtifact').WidgetExportArtifact} artifact
 * @param {number} width
 * @param {number} height
 */
export async function artifactToPngBytes(artifact, width, height) {
  if (!artifact) return null;
  if (artifact.mimeType === "image/png") {
    return artifact.payload;
  }
  if (artifact.mimeType === "text/html") {
    const png = await htmlToPngArtifact(artifact.payload, width, height);
    return png?.payload || null;
  }
  return null;
}

/**
 * @param {{
 *   manifestItem: { componentId: string; type: string; rect: { width: number; height: number } };
 *   component: { content?: object };
 *   journalDatasources: unknown[];
 *   sourceDataByDatasourceId: Record<string, unknown>;
 * }} params
 */
export async function exportWidgetArtifact({
  manifestItem,
  component,
  journalDatasources,
  sourceDataByDatasourceId,
}) {
  const { componentId, type, rect } = manifestItem;
  const content = component?.content || {};

  let artifact = null;

  switch (type) {
    case "GRAPH":
      artifact = await exportGraphWidget({ componentId, rect });
      break;
    case "HYPVIS":
      artifact = await exportHypVisWidget({ componentId, rect });
      break;
    case "TABLE":
      artifact = await exportTableWidget({
        content,
        rect,
        journalDatasources,
        sourceDataByDatasourceId,
      });
      break;
    case "PARAGRAPH":
      artifact = await exportParagraphWidget({ content, rect });
      break;
    default:
      artifact = await rasterizeWidgetElement(componentId, {
        width: rect.width,
        height: rect.height,
      });
      break;
  }

  if (!artifact) {
    artifact = await rasterizeWidgetElement(componentId, {
      width: rect.width,
      height: rect.height,
    });
    if (artifact) {
      artifact.usedFallback = true;
      artifact.source = "raster";
    }
  }

  return artifact;
}
