import { PDFDocument, rgb } from "pdf-lib";
import {
  PDF_PAGE_HEIGHT_PT,
  PDF_PAGE_MARGIN_PT,
  PDF_PAGE_WIDTH_PT,
} from "./constants";
import { artifactToPngBytes } from "./adapters";

/**
 * Fit dimensions inside a box preserving aspect ratio.
 */
export function fitRectPreserveAspect(
  intrinsicWidth,
  intrinsicHeight,
  boxWidth,
  boxHeight,
) {
  if (intrinsicWidth <= 0 || intrinsicHeight <= 0) {
    return { width: boxWidth, height: boxHeight };
  }
  const scale = Math.min(
    boxWidth / intrinsicWidth,
    boxHeight / intrinsicHeight,
  );
  return {
    width: intrinsicWidth * scale,
    height: intrinsicHeight * scale,
  };
}

/**
 * @param {ReturnType<import('./buildCanvasExportManifest').buildCanvasExportManifest>} manifest
 * @param {Map<string, import('./widgetArtifact').WidgetExportArtifact>} artifactsByComponentId
 */
export async function composeTiledPdf(manifest, artifactsByComponentId) {
  const contentWidth = PDF_PAGE_WIDTH_PT - PDF_PAGE_MARGIN_PT * 2;
  const contentHeight = PDF_PAGE_HEIGHT_PT - PDF_PAGE_MARGIN_PT * 2;

  const canvasWidth = manifest.canvasWidth;
  const canvasHeight = manifest.canvasHeight;
  const scale = contentWidth / canvasWidth;
  const scaledCanvasHeight = canvasHeight * scale;

  const pageCount = Math.max(
    1,
    Math.ceil(scaledCanvasHeight / contentHeight),
  );

  const pdfDoc = await PDFDocument.create();
  const embeddedImages = new Map();

  for (const item of manifest.items) {
    const artifact = artifactsByComponentId.get(item.componentId);
    if (!artifact) continue;

    const pngBytes = await artifactToPngBytes(
      artifact,
      item.rect.width,
      item.rect.height,
    );
    if (!pngBytes) continue;

    try {
      const image = await pdfDoc.embedPng(pngBytes);
      embeddedImages.set(item.componentId, image);
    } catch (err) {
      console.error("composeTiledPdf embedPng:", item.componentId, err);
    }
  }

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const page = pdfDoc.addPage([PDF_PAGE_WIDTH_PT, PDF_PAGE_HEIGHT_PT]);
    const pageTopScaled = pageIndex * contentHeight;

    page.drawRectangle({
      x: PDF_PAGE_MARGIN_PT,
      y: PDF_PAGE_MARGIN_PT,
      width: contentWidth,
      height: contentHeight,
      color: rgb(1, 1, 1),
    });

    for (const item of manifest.items) {
      const image = embeddedImages.get(item.componentId);
      if (!image) continue;

      const scaledLeft = item.rect.left * scale;
      const scaledTop = item.rect.top * scale;
      const scaledWidth = item.rect.width * scale;
      const scaledHeight = item.rect.height * scale;

      const itemBottom = scaledTop + scaledHeight;
      const pageBottom = pageTopScaled + contentHeight;

      if (itemBottom <= pageTopScaled || scaledTop >= pageBottom) {
        continue;
      }

      const fitted = fitRectPreserveAspect(
        image.width,
        image.height,
        scaledWidth,
        scaledHeight,
      );

      const yOnPage = scaledTop - pageTopScaled;
      const drawX = PDF_PAGE_MARGIN_PT + scaledLeft;
      const drawY =
        PDF_PAGE_HEIGHT_PT - PDF_PAGE_MARGIN_PT - yOnPage - fitted.height;

      page.drawImage(image, {
        x: drawX,
        y: drawY,
        width: fitted.width,
        height: fitted.height,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();

  let previewPngBytes = null;
  const firstItem = manifest.items.find((i) =>
    embeddedImages.has(i.componentId),
  );
  if (firstItem) {
    const artifact = artifactsByComponentId.get(firstItem.componentId);
    if (artifact?.mimeType === "image/png") {
      previewPngBytes = artifact.payload;
    }
  }

  return {
    pdfBytes,
    previewPngBytes,
    pageCount,
  };
}
