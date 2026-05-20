/** MediaAsset.settings.createdWith value for Data Journal canva PDF exports. */
export const DATA_TOOL_CANVA_CREATED_WITH = "data-tool-canva";

/** react-grid-layout settings (must match Grid.js). */
export const GRID_COLS = 12;
export const GRID_ROW_HEIGHT = 30;
export const GRID_MARGIN_X = 16;
export const GRID_MARGIN_Y = 16;

/** A4 page size in PDF points (72 pt per inch). */
export const PDF_PAGE_WIDTH_PT = 595.28;
export const PDF_PAGE_HEIGHT_PT = 841.89;
export const PDF_PAGE_MARGIN_PT = 36;

export const FIGURE_READY_TYPES = new Set(["GRAPH", "HYPVIS"]);

/** Widget types omitted from canva PDF export (layout cell left empty). */
export const UNSUPPORTED_EXPORT_TYPES = new Set(["TABLE", "CODE"]);

/** html2canvas / supersampled native export multiplier (capped for memory). */
export const EXPORT_RASTER_SCALE = 3;
