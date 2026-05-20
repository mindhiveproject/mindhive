import { plotlyPngFileFromFigureSection } from "../../Widgets/types/Graph/plotlyPngFileFromFigure";
import { EXPORT_RASTER_SCALE } from "../constants";
import { fileToPngArtifact } from "../widgetArtifact";
import { rasterizeWidgetElement } from "./rasterFallback";

/**
 * @param {{ componentId: string; rect: { width: number; height: number } }} params
 */
export async function exportGraphWidget({ componentId, rect }) {
  const layoutWidth = Math.max(1, Math.round(rect.width));
  const layoutHeight = Math.max(1, Math.round(rect.height));

  const file = await plotlyPngFileFromFigureSection(componentId, {
    width: layoutWidth,
    height: layoutHeight,
    scale: EXPORT_RASTER_SCALE,
    fileName: "graph-export",
  });

  if (file) {
    return fileToPngArtifact(file, { source: "native", usedFallback: false });
  }

  const raster = await rasterizeWidgetElement(componentId, {
    width: layoutWidth,
    height: layoutHeight,
  });
  return raster;
}
