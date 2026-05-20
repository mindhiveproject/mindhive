import {
  GRID_COLS,
  GRID_MARGIN_X,
  GRID_MARGIN_Y,
  GRID_ROW_HEIGHT,
} from "./constants";

/**
 * Compute pixel rect from react-grid-layout item (fallback when DOM node missing).
 */
export function gridItemToPixelRect(
  layoutItem,
  gridWidth,
  rowHeight = GRID_ROW_HEIGHT,
  cols = GRID_COLS,
  marginX = GRID_MARGIN_X,
  marginY = GRID_MARGIN_Y,
) {
  const w = Number(layoutItem?.w) || 1;
  const h = Number(layoutItem?.h) || 1;
  const x = Number(layoutItem?.x) || 0;
  const y = Number(layoutItem?.y) || 0;

  const colWidth = (gridWidth - marginX * (cols + 1)) / cols;
  const width = w * colWidth + (w - 1) * marginX;
  const height = h * rowHeight + (h - 1) * marginY;
  const left = x * (colWidth + marginX) + marginX;
  const top = y * (rowHeight + marginY) + marginY;

  return { left, top, width, height };
}

/**
 * Build export manifest from live canvas DOM + grid layout.
 *
 * @param {{
 *   canvasElement: HTMLElement | null;
 *   layout: Array<{ i: string; x: number; y: number; w: number; h: number }>;
 *   components: Array<{ id: string; type: string; title?: string }>;
 *   gridWidth: number;
 *   rowHeight?: number;
 *   cols?: number;
 * }} params
 */
export function buildCanvasExportManifest({
  canvasElement,
  layout,
  components,
  gridWidth,
  rowHeight = GRID_ROW_HEIGHT,
  cols = GRID_COLS,
}) {
  if (!canvasElement || !Array.isArray(layout) || !Array.isArray(components)) {
    return null;
  }

  const safeGridWidth = Number.isFinite(gridWidth) && gridWidth > 0 ? gridWidth : 1200;
  const canvasRect = canvasElement.getBoundingClientRect();
  const scrollLeft = canvasElement.scrollLeft || 0;
  const scrollTop = canvasElement.scrollTop || 0;

  const layoutById = new Map(
    layout
      .filter((item) => item?.i)
      .map((item, index) => [String(item.i), { ...item, zIndex: index }]),
  );

  const items = [];

  components.forEach((component) => {
    const componentId = component?.id;
    if (!componentId) return;

    const layoutItem = layoutById.get(String(componentId));
    if (!layoutItem) return;

    const widgetEl = canvasElement.querySelector(
      `[data-widget-id="${componentId}"]`,
    );

    let rect;
    if (widgetEl) {
      const widgetRect = widgetEl.getBoundingClientRect();
      rect = {
        left: widgetRect.left - canvasRect.left + scrollLeft,
        top: widgetRect.top - canvasRect.top + scrollTop,
        width: widgetRect.width,
        height: widgetRect.height,
      };
    } else {
      rect = gridItemToPixelRect(
        layoutItem,
        safeGridWidth,
        rowHeight,
        cols,
      );
    }

    if (rect.width <= 0 || rect.height <= 0) return;

    items.push({
      componentId: String(componentId),
      type: component.type,
      title: typeof component.title === "string" ? component.title : "",
      grid: {
        x: layoutItem.x,
        y: layoutItem.y,
        w: layoutItem.w,
        h: layoutItem.h,
      },
      rect,
      zIndex: layoutItem.zIndex,
    });
  });

  items.sort((a, b) => a.zIndex - b.zIndex);

  const canvasHeight = Math.max(
    canvasElement.scrollHeight || 0,
    items.reduce((max, item) => {
      const bottom = item.rect.top + item.rect.height;
      return bottom > max ? bottom : max;
    }, 0),
  );

  return {
    capturedAt: new Date().toISOString(),
    canvasWidth: safeGridWidth,
    canvasHeight,
    gridWidth: safeGridWidth,
    rowHeight,
    cols,
    margin: [GRID_MARGIN_X, GRID_MARGIN_Y],
    items,
  };
}
