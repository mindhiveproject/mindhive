import {
  selectorListForPyodide,
  selectorValueForPyodide,
} from "../../../../../Helpers/selectorValueForPyodide";

import { rowsForGraphColorKeys } from "./graphColorSliceRows";

/** Aligns with Plotly templates `brand_palette`. */
export const BRAND_PALETTE = ["#7D70AD", "#69BBC4", "#CF6D6A", "#F2BE42"];

/**
 * Stable key for `selectors.graphColors.scatter.byGroup` when the grouping column
 * is missing, null, blank, or whitespace-only (Plotly trace names vary: "", "nan", etc.).
 */
export const SCATTER_GROUP_NO_LABEL_KEY = "__no_label__";

/** Map a Plotly scatter trace `name` to the `byGroup` object key we store in selectors. */
export function scatterByGroupKeyFromTraceName(name) {
  const nm = String(name ?? "").trim();
  if (!nm) return SCATTER_GROUP_NO_LABEL_KEY;
  const lower = nm.toLowerCase();
  if (lower === "nan" || lower === "null" || nm === "None") return SCATTER_GROUP_NO_LABEL_KEY;
  return nm;
}

export function normalizeHex(input) {
  if (input == null) return null;
  const s = String(input).trim();
  if (!s) return null;
  if (/^#[0-9A-Fa-f]{6}$/i.test(s)) {
    return `#${s.slice(1).toUpperCase()}`;
  }
  if (/^#[0-9A-Fa-f]{3}$/i.test(s)) {
    const r = s[1];
    const g = s[2];
    const b = s[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return null;
}

/** `<input type="color">` requires #rrggbb. */
export function hexForColorInput(hexOrNull) {
  const n = normalizeHex(hexOrNull);
  return n || BRAND_PALETTE[0];
}

function sortKeyStrings(values) {
  const arr = Array.from(values).map((v) => (v == null ? "" : String(v)));
  return [...new Set(arr)].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/**
 * @param {Record<string, unknown>[]} rows
 * @param {string} columnKey - key as in renamed rows (use selectorValueForPyodide)
 */
export function sortedUniqueColumnValues(rows, columnKey) {
  if (!columnKey || !Array.isArray(rows)) return [];
  const set = new Set();
  for (const row of rows) {
    if (row && Object.prototype.hasOwnProperty.call(row, columnKey)) {
      const v = row[columnKey];
      if (v != null && v !== "") set.add(v);
    }
  }
  return sortKeyStrings(set);
}

/**
 * Bar wide: column names in Pyodide df order.
 * @param {unknown[]} colToPlot
 * @param {unknown[]} variables
 */
export function barWideCategoryKeys(colToPlot, variables) {
  return selectorListForPyodide(colToPlot || [], variables);
}

/**
 * Bar long: sorted unique qual values (string keys), same spirit as Python `sorted(df[qualCol].dropna().unique())`.
 */
export function barLongCategoryKeys(rows, qualCol, variables) {
  const key = selectorValueForPyodide(qualCol, variables);
  if (!key) return [];
  return sortedUniqueColumnValues(rows, key);
}

export function scatterGroupKeys(rows, groupVariable, variables) {
  const key = selectorValueForPyodide(groupVariable, variables);
  if (!key || !Array.isArray(rows)) return [];
  let hasNoLabel = false;
  const set = new Set();
  for (const row of rows) {
    if (!row || !Object.prototype.hasOwnProperty.call(row, key)) {
      hasNoLabel = true;
      continue;
    }
    const v = row[key];
    if (v == null || v === "" || (typeof v === "string" && !v.trim())) {
      hasNoLabel = true;
    } else {
      set.add(v);
    }
  }
  const sorted = sortKeyStrings(set);
  if (hasNoLabel) {
    return [...sorted, SCATTER_GROUP_NO_LABEL_KEY];
  }
  return sorted;
}

/**
 * Histogram series keys for color UI (must match Python legend / trace naming).
 * @returns {string[]}
 */
export function histogramSeriesKeys(selectors, variables, slice) {
  const rows = rowsForGraphColorKeys(slice);
  const xList = selectorListForPyodide(selectors?.X || [], variables);
  const groupKey = selectorValueForPyodide(selectors?.Group, variables);
  if (xList.length === 0) return [];
  if (xList.length === 1) {
    if (groupKey) {
      return sortedUniqueColumnValues(rows, groupKey);
    }
    return ["__default__"];
  }
  return xList;
}
