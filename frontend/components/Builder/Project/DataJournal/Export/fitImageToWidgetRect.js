/**
 * Width-first fit: fill widget cell width, scale height proportionally, then shrink if needed.
 * Horizontally centers when uniform scale reduces width below box width.
 *
 * @param {number} imageWidth - intrinsic image width (px)
 * @param {number} imageHeight - intrinsic image height (px)
 * @param {number} boxWidth - target widget width on PDF (pt)
 * @param {number} boxHeight - target widget height on PDF (pt)
 * @returns {{ width: number; height: number; offsetX: number }}
 */
export function fitImageToWidgetRect(imageWidth, imageHeight, boxWidth, boxHeight) {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return { width: boxWidth, height: boxHeight, offsetX: 0 };
  }

  let drawWidth = boxWidth;
  let drawHeight = (boxWidth * imageHeight) / imageWidth;

  if (drawHeight > boxHeight) {
    const scale = boxHeight / drawHeight;
    drawWidth *= scale;
    drawHeight = boxHeight;
  }

  const offsetX = Math.max(0, (boxWidth - drawWidth) / 2);

  return {
    width: drawWidth,
    height: drawHeight,
    offsetX,
  };
}
