import { rasterizeWidgetElement } from "./rasterFallback";

/**
 * Capture statistical test result (Semantic UI tables + interpretation).
 *
 * @param {{ componentId: string; rect: { width: number; height: number } }} params
 */
export async function exportStatTestWidget({ componentId, rect }) {
  const width = Math.max(1, Math.round(rect.width));

  const artifact = await rasterizeWidgetElement(componentId, {
    width,
    height: rect.height,
    selector: ".widget-content-handle > div",
  });

  if (artifact) {
    artifact.usedFallback = false;
    artifact.source = "native";
  }

  return artifact;
}
