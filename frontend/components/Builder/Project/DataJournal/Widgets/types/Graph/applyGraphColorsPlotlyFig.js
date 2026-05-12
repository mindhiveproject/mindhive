/**
 * Applies `content.selectors.graphColors` (and legacy `selectors.color` where relevant)
 * to a Plotly figure JSON object. Runs in the browser after Pyodide returns `fig.to_json()`,
 * so colors work even when persisted `content.code` is an older template that never
 * read `graph_colors_json` in Python.
 */

import { scatterByGroupKeyFromTraceName, SCATTER_GROUP_NO_LABEL_KEY } from "./Editor/_shared/graphColorUtils";

const BRAND_PALETTE = ["#7D70AD", "#69BBC4", "#CF6D6A", "#F2BE42"];

function isHexColor(s) {
  if (typeof s !== "string") return false;
  const t = s.trim();
  return /^#[0-9A-Fa-f]{6}$/i.test(t) || /^#[0-9A-Fa-f]{3}$/i.test(t);
}

function hasScatterGc(gc) {
  if (!gc?.scatter || typeof gc.scatter !== "object") return false;
  const s = gc.scatter;
  if (isHexColor(s.markerDefault) || isHexColor(s.trendline)) return true;
  const bg = s.byGroup;
  return bg && typeof bg === "object" && Object.keys(bg).some((k) => isHexColor(bg[k]));
}

function hasBarGc(gc) {
  const bc = gc?.bar?.byCategory;
  return bc && typeof bc === "object" && Object.keys(bc).some((k) => isHexColor(bc[k]));
}

function hasHistGc(gc) {
  const bs = gc?.histogram?.bySeries;
  return bs && typeof bs === "object" && Object.keys(bs).some((k) => isHexColor(bs[k]));
}

/**
 * @param {object} parsed Plotly figure JSON
 * @param {{ type?: string; selectors?: Record<string, unknown> } | null | undefined} content
 * @returns {object}
 */
export function applyGraphColorsPlotlyFig(parsed, content) {
  if (!parsed?.data || !Array.isArray(parsed.data)) return parsed;

  const gc = content?.selectors?.graphColors;
  const selectors = content?.selectors || {};
  const type = content?.type;

  const legacyColorRaw = selectors.color == null ? "" : String(selectors.color).trim();
  const legacyColor = legacyColorRaw === "pink" ? "" : legacyColorRaw;
  const legacyHex = legacyColor.startsWith("#") ? legacyColor : "";

  const runScatter = type === "scatterPlot" && (hasScatterGc(gc) || legacyHex);
  const runBar = type === "barGraph" && (hasBarGc(gc) || legacyHex);
  const runHist = type === "histogram" && (hasHistGc(gc) || legacyHex);

  if (!runScatter && !runBar && !runHist) return parsed;

  const out = JSON.parse(JSON.stringify(parsed));

  if (runScatter) {
    const sc = (gc && gc.scatter) || {};
    const byGroup = sc.byGroup && typeof sc.byGroup === "object" ? sc.byGroup : {};
    let markerDefault = String(sc.markerDefault || "").trim();
    const trendHex = String(sc.trendline || "").trim();
    if (!markerDefault.startsWith("#") && legacyHex) {
      markerDefault = legacyHex;
    }

    const groupVar = String(selectors.groupVariable || "").trim();
    const scatterNames = [];
    for (const tr of out.data) {
      if (tr.type !== "scatter") continue;
      const nm = String(tr.name || "");
      if (/ols/i.test(nm)) continue;
      scatterNames.push(nm);
    }
    const orderedNames = [];
    const seen = new Set();
    for (const nm of scatterNames) {
      if (!seen.has(nm)) {
        seen.add(nm);
        orderedNames.push(nm);
      }
    }

    const has_group =
      Object.keys(byGroup).length > 0 ||
      (orderedNames.length > 1 && Boolean(groupVar)) ||
      (Boolean(groupVar) &&
        orderedNames.some((n) => scatterByGroupKeyFromTraceName(n) === SCATTER_GROUP_NO_LABEL_KEY));

    const useTrendline = Boolean(selectors.trendLine);
    let idx = 0;

    for (const tr of out.data) {
      if (tr.type !== "scatter") continue;
      const nm = String(tr.name || "");
      if (/ols/i.test(nm)) {
        if (useTrendline && trendHex.startsWith("#")) {
          tr.line = tr.line || {};
          tr.line.color = trendHex;
        }
        continue;
      }
      if (has_group) {
        const lookupKey = scatterByGroupKeyFromTraceName(nm);
        let c =
          byGroup[lookupKey] ||
          (lookupKey !== nm ? byGroup[nm] || byGroup[String(tr.name ?? "")] : undefined);
        if (!isHexColor(c)) {
          let ix = idx;
          const j = orderedNames.indexOf(nm);
          if (j >= 0) ix = j;
          c = BRAND_PALETTE[ix % BRAND_PALETTE.length];
        }
        tr.marker = tr.marker || {};
        tr.marker.color = c;
        idx += 1;
      } else {
        let c = markerDefault.startsWith("#") ? markerDefault : null;
        if (!c && legacyHex) c = legacyHex;
        if (!c) c = BRAND_PALETTE[0];
        tr.marker = tr.marker || {};
        tr.marker.color = c;
      }
    }
    return out;
  }

  if (runBar) {
    const byCat =
      gc?.bar?.byCategory && typeof gc.bar.byCategory === "object" ? gc.bar.byCategory : {};
    const hasByCatHex = Object.keys(byCat).some((k) => isHexColor(byCat[k]));
    let i = 0;
    for (const tr of out.data) {
      if (tr.type !== "bar") continue;
      const nm = String(tr.name ?? "");
      let c = hasByCatHex && isHexColor(byCat[nm]) ? byCat[nm].trim() : null;
      if (!c && legacyHex) c = legacyHex;
      if (!c) c = BRAND_PALETTE[i % BRAND_PALETTE.length];
      tr.marker = tr.marker || {};
      tr.marker.color = c;
      i += 1;
    }
    return out;
  }

  if (runHist) {
    const byS =
      gc?.histogram?.bySeries && typeof gc.histogram.bySeries === "object"
        ? gc.histogram.bySeries
        : {};
    const hasByS = Object.keys(byS).some((k) => isHexColor(byS[k]));
    let i = 0;
    for (const tr of out.data) {
      if (tr.type !== "histogram") continue;
      let nm = tr.name != null ? String(tr.name) : "";
      if (nm === "" || nm === "null") nm = "__default__";
      let c = isHexColor(byS[nm])
        ? byS[nm].trim()
        : isHexColor(byS[String(tr.name)])
          ? byS[String(tr.name)].trim()
          : null;
      if (!c && !hasByS && legacyHex) c = legacyHex;
      if (!c) c = BRAND_PALETTE[i % BRAND_PALETTE.length];
      tr.marker = tr.marker || {};
      tr.marker.color = c;
      i += 1;
    }
    return out;
  }

  return parsed;
}
