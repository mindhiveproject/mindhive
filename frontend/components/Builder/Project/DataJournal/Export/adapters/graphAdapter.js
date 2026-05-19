import { plotlyPngFileFromFigureSection } from "../../Widgets/types/Graph/plotlyPngFileFromFigure";
import { fileToPngArtifact } from "../widgetArtifact";
import { rasterizeWidgetElement } from "./rasterFallback";

/**
 * @param {{ componentId: string; rect: { width: number; height: number } }} params
 */
export async function exportGraphWidget({ componentId, rect }) {
  const exportWidth = Math.max(1, Math.round(rect.width));
  const exportHeight = Math.max(1, Math.round(rect.height));

  const file = await plotlyPngFileFromFigureSection(componentId, {
    width: exportWidth,
    height: exportHeight,
    fileName: "graph-export",
  });

  if (file) {
    return fileToPngArtifact(file, { source: "native", usedFallback: false });
  }

  const raster = await rasterizeWidgetElement(componentId, {
    width: exportWidth,
    height: exportHeight,
  });
  return raster;
}
