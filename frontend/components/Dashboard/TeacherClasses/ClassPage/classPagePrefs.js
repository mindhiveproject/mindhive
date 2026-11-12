const STORAGE_PREFIX = "mindhive.classPrefs.";
// Per-class localStorage: page, dashboard, matchingRound, tables.

function storageKey(classId) {
  return `${STORAGE_PREFIX}${classId}`;
}

export function readClassPrefs(classId) {
  if (!classId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(classId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeClassPrefs(classId, patch) {
  if (!classId || typeof window === "undefined" || !patch) return;
  try {
    const current = readClassPrefs(classId) || {};
    const next = { ...current, ...patch };
    if (patch.dashboard) {
      next.dashboard = {
        ...(current.dashboard || {}),
        ...patch.dashboard,
      };
    } else {
      next.dashboard = current.dashboard || {};
    }
    if (patch.matchingRound) {
      const currentMatching = current.matchingRound || {};
      const patchMatching = patch.matchingRound;
      next.matchingRound = {
        ...currentMatching,
        ...patchMatching,
        panelByRoundId: {
          ...(currentMatching.panelByRoundId || {}),
          ...(patchMatching.panelByRoundId || {}),
        },
      };
    } else {
      next.matchingRound = current.matchingRound || {};
    }
    if (patch.tables) {
      next.tables = {
        ...(current.tables || {}),
        ...patch.tables,
      };
    } else {
      next.tables = current.tables || {};
    }
    window.localStorage.setItem(storageKey(classId), JSON.stringify(next));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function writeClassPagePref(classId, page) {
  if (!page) return;
  writeClassPrefs(classId, { page });
}

export function writeClassDashboardPrefs(classId, { template, steps } = {}) {
  writeClassPrefs(classId, {
    dashboard: {
      template: template || null,
      steps: steps?.length ? steps : null,
      step: null,
    },
  });
}

const MATCHING_ROUND_PERSISTABLE_PANELS = new Set([
  "review",
  "selected",
  "forms",
  "studentInterest",
  "matches",
]);

export function readClassMatchingRoundPanelPref(classId, roundId) {
  if (!classId || !roundId) return null;
  const panel = readClassPrefs(classId)?.matchingRound?.panelByRoundId?.[roundId];
  if (
    typeof panel !== "string" ||
    !MATCHING_ROUND_PERSISTABLE_PANELS.has(panel)
  ) {
    return null;
  }
  return panel;
}

export function writeClassMatchingRoundPanelPref(classId, roundId, panel) {
  if (
    !classId ||
    !roundId ||
    !panel ||
    !MATCHING_ROUND_PERSISTABLE_PANELS.has(panel)
  ) {
    return;
  }
  writeClassPrefs(classId, {
    matchingRound: {
      panelByRoundId: {
        [roundId]: panel,
      },
    },
  });
}

// Table layouts (column order, widths, sort, filters, page size) live in one
// cookie per class + table so they survive leaving the page; older layouts
// saved under localStorage `tables` are still read as a fallback.
const TABLE_COOKIE_PREFIX = "mh_tbl_";
const TABLE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const COOKIE_VALUE_LIMIT = 3800;

function tableCookieName(classId, tableId) {
  return `${TABLE_COOKIE_PREFIX}${tableId}_${classId}`.replace(
    /[^A-Za-z0-9_-]/g,
    "_"
  );
}

function readCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return null;
  }
}

function writeCookie(name, value) {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location?.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=${value}; Max-Age=${TABLE_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

// Only what's needed to restore the layout, to stay under the cookie limit.
function compactColumnState(columnState) {
  return columnState
    .filter((col) => col && typeof col.colId === "string")
    .map((col) => {
      const out = { colId: col.colId };
      if (typeof col.width === "number") out.width = Math.round(col.width);
      if (col.flex !== undefined) out.flex = col.flex;
      if (col.hide) out.hide = true;
      if (col.pinned) out.pinned = col.pinned;
      out.sort = col.sort || null;
      if (col.sortIndex != null) out.sortIndex = col.sortIndex;
      return out;
    });
}

function normalizeTablePrefs(table) {
  if (!table || typeof table !== "object") return null;
  const columnState = Array.isArray(table.columnState) ? table.columnState : null;
  const filterModel =
    table.filterModel &&
    typeof table.filterModel === "object" &&
    !Array.isArray(table.filterModel)
      ? table.filterModel
      : null;
  const pageSize =
    typeof table.pageSize === "number" &&
    Number.isFinite(table.pageSize) &&
    table.pageSize > 0
      ? table.pageSize
      : null;
  if (!columnState && !filterModel && !pageSize) return null;
  return { columnState, filterModel, pageSize };
}

export function readClassTablePrefs(classId, tableId) {
  if (!classId || !tableId) return null;
  const raw = readCookie(tableCookieName(classId, tableId));
  if (raw) {
    try {
      const fromCookie = normalizeTablePrefs(JSON.parse(raw));
      if (fromCookie) return fromCookie;
    } catch {
      // Fall through to the legacy localStorage copy.
    }
  }
  return normalizeTablePrefs(readClassPrefs(classId)?.tables?.[tableId]);
}

export function writeClassTablePrefs(classId, tableId, state) {
  if (!classId || !tableId || typeof tableId !== "string" || !state) return;
  const columnState = Array.isArray(state.columnState)
    ? compactColumnState(state.columnState)
    : [];
  const filterModel =
    state.filterModel &&
    typeof state.filterModel === "object" &&
    !Array.isArray(state.filterModel)
      ? state.filterModel
      : {};
  const pageSize =
    typeof state.pageSize === "number" &&
    Number.isFinite(state.pageSize) &&
    state.pageSize > 0
      ? state.pageSize
      : undefined;
  const base = { columnState, ...(pageSize != null ? { pageSize } : {}) };
  // Drop the filters before giving up if the cookie would be too large.
  const candidates = [{ ...base, filterModel }, { ...base, filterModel: {} }];
  for (const candidate of candidates) {
    const value = encodeURIComponent(JSON.stringify(candidate));
    if (value.length <= COOKIE_VALUE_LIMIT) {
      writeCookie(tableCookieName(classId, tableId), value);
      return;
    }
  }
}

// Small per-table switches (e.g. the Studies "collecting data only" toggle),
// one cookie per class + table + option.
function tableOptionCookieName(classId, tableId, option) {
  return `${tableCookieName(classId, tableId)}_${option}`.replace(
    /[^A-Za-z0-9_-]/g,
    "_"
  );
}

export function readClassTableOption(classId, tableId, option) {
  if (!classId || !tableId || !option) return null;
  const raw = readCookie(tableOptionCookieName(classId, tableId, option));
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeClassTableOption(classId, tableId, option, value) {
  if (!classId || !tableId || !option) return;
  writeCookie(
    tableOptionCookieName(classId, tableId, option),
    encodeURIComponent(JSON.stringify(value ?? null))
  );
}
