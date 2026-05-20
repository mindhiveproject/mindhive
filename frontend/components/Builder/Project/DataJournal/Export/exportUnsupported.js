import { UNSUPPORTED_EXPORT_TYPES } from "./constants";

/**
 * @param {Array<{ type?: string }>} [components]
 */
export function getUnsupportedExportComponents(components) {
  return (components || []).filter((c) =>
    UNSUPPORTED_EXPORT_TYPES.has(c?.type),
  );
}

/**
 * @param {Array<{ type?: string }>} [components]
 */
export function hasExportableComponents(components) {
  return (components || []).some(
    (c) => !UNSUPPORTED_EXPORT_TYPES.has(c?.type),
  );
}
