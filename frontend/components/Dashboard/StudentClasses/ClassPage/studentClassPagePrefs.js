const STORAGE_PREFIX = "mindhive.studentClassPrefs.";

const VALID_FILTER_MODES = new Set(["all", "favorites"]);

function storageKey(classId) {
  return `${STORAGE_PREFIX}${classId}`;
}

function readPrefs(classId) {
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

function normalizeBrowsePrefs(raw) {
  if (!raw || typeof raw !== "object") return null;

  const filterMode = VALID_FILTER_MODES.has(raw.filterMode)
    ? raw.filterMode
    : "all";
  const categoryFilter =
    typeof raw.categoryFilter === "string" ? raw.categoryFilter : null;
  const searchQuery =
    typeof raw.searchQuery === "string" ? raw.searchQuery : "";

  return { filterMode, categoryFilter, searchQuery };
}

export function readStudentOpportunityBrowsePrefs(classId) {
  const browse = readPrefs(classId)?.opportunitiesBrowse;
  return normalizeBrowsePrefs(browse);
}

export function writeStudentOpportunityBrowsePrefs(classId, patch) {
  if (!classId || typeof window === "undefined" || !patch) return;
  try {
    const current = readPrefs(classId) || {};
    const currentBrowse = current.opportunitiesBrowse || {};
    const nextBrowse = { ...currentBrowse, ...patch };

    if (
      nextBrowse.filterMode &&
      !VALID_FILTER_MODES.has(nextBrowse.filterMode)
    ) {
      nextBrowse.filterMode = "all";
    }
    if (
      nextBrowse.categoryFilter != null &&
      typeof nextBrowse.categoryFilter !== "string"
    ) {
      nextBrowse.categoryFilter = null;
    }
    if (typeof nextBrowse.searchQuery !== "string") {
      nextBrowse.searchQuery = "";
    }

    window.localStorage.setItem(
      storageKey(classId),
      JSON.stringify({
        ...current,
        opportunitiesBrowse: nextBrowse,
      }),
    );
  } catch {
    // Ignore quota / private-mode failures.
  }
}
