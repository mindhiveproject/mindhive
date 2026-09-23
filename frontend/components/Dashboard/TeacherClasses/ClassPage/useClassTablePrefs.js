import { useCallback, useEffect, useMemo, useRef } from "react";

import { readClassTablePrefs, writeClassTablePrefs } from "./classPagePrefs";

const DEFAULT_AUTO_SIZE = { type: "fitGridWidth", defaultMinWidth: 100 };
const DEBOUNCE_MS = 300;

function collectTableState(api) {
  if (!api) return null;
  const columnState =
    typeof api.getColumnState === "function" ? api.getColumnState() : null;
  const filterModel =
    typeof api.getFilterModel === "function" ? api.getFilterModel() : null;
  let pageSize = null;
  if (typeof api.paginationGetPageSize === "function") {
    try {
      pageSize = api.paginationGetPageSize();
    } catch {
      pageSize = null;
    }
  }
  return {
    columnState: Array.isArray(columnState) ? columnState : [],
    filterModel: filterModel && typeof filterModel === "object" ? filterModel : {},
    ...(typeof pageSize === "number" && pageSize > 0 ? { pageSize } : {}),
  };
}

function applyTableState(api, state) {
  if (!api || !state) return;
  if (state.columnState?.length) {
    const columns =
      typeof api.getColumns === "function" ? api.getColumns() || [] : [];
    const existingIds = new Set(columns.map((col) => col.getColId()));
    const filtered = state.columnState.filter(
      (col) => col && typeof col.colId === "string" && existingIds.has(col.colId)
    );
    if (filtered.length && typeof api.applyColumnState === "function") {
      api.applyColumnState({ state: filtered, applyOrder: true });
    }
  }
  if (state.filterModel && typeof api.setFilterModel === "function") {
    api.setFilterModel(state.filterModel);
  }
  if (state.pageSize) {
    if (typeof api.setGridOption === "function") {
      api.setGridOption("paginationPageSize", state.pageSize);
    } else if (typeof api.paginationSetPageSize === "function") {
      api.paginationSetPageSize(state.pageSize);
    }
  }
}

export function useClassTablePrefs(
  classId,
  tableId,
  { defaultPageSize, fitToWidth = true } = {}
) {
  const saved = useMemo(
    () => readClassTablePrefs(classId, tableId),
    [classId, tableId]
  );
  const savedRef = useRef(saved);
  savedRef.current = saved;

  const applyingRef = useRef(false);
  const apiRef = useRef(null);
  const timeoutRef = useRef(null);
  const classIdRef = useRef(classId);
  const tableIdRef = useRef(tableId);

  const persistTo = useCallback((targetClassId, targetTableId) => {
    if (!targetClassId || !targetTableId || applyingRef.current) return;
    const api = apiRef.current;
    if (!api) return;
    const next = collectTableState(api);
    if (!next) return;
    writeClassTablePrefs(targetClassId, targetTableId, next);
  }, []);

  const persist = useCallback(() => {
    persistTo(classIdRef.current, tableIdRef.current);
  }, [persistTo]);

  const schedulePersist = useCallback(() => {
    if (applyingRef.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      persist();
    }, DEBOUNCE_MS);
  }, [persist]);

  const restore = useCallback((api) => {
    const state = savedRef.current;
    if (!api || !state) return;
    applyingRef.current = true;
    try {
      applyTableState(api, state);
    } finally {
      requestAnimationFrame(() => {
        applyingRef.current = false;
      });
    }
  }, []);

  useEffect(() => {
    const prevClassId = classIdRef.current;
    const prevTableId = tableIdRef.current;
    const tableChanged = prevClassId !== classId || prevTableId !== tableId;
    if (tableChanged && apiRef.current) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      persistTo(prevClassId, prevTableId);
    }
    classIdRef.current = classId;
    tableIdRef.current = tableId;
    if (apiRef.current && tableChanged) {
      restore(apiRef.current);
    }
  }, [classId, tableId, persistTo, restore]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      persist();
    },
    [persist]
  );

  const onGridReady = useCallback(
    (params) => {
      const api = params?.api;
      if (!api) return;
      apiRef.current = api;
      restore(api);
    },
    [restore]
  );

  const onColumnResized = useCallback(
    (params) => {
      if (params?.finished === false) return;
      schedulePersist();
    },
    [schedulePersist]
  );

  const hasSavedColumnState = Boolean(saved?.columnState?.length);

  return {
    onGridReady,
    onColumnResized,
    onColumnMoved: schedulePersist,
    onColumnVisible: schedulePersist,
    onColumnPinned: schedulePersist,
    onSortChanged: schedulePersist,
    onFilterChanged: schedulePersist,
    onPaginationChanged: schedulePersist,
    ...(fitToWidth && !hasSavedColumnState
      ? { autoSizeStrategy: DEFAULT_AUTO_SIZE }
      : {}),
    ...(saved?.pageSize
      ? { paginationPageSize: saved.pageSize }
      : defaultPageSize
        ? { paginationPageSize: defaultPageSize }
        : {}),
  };
}
