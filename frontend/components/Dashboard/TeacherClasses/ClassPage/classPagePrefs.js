const STORAGE_PREFIX = "mindhive.classPrefs.";

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
    window.localStorage.setItem(storageKey(classId), JSON.stringify(next));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function writeClassPagePref(classId, page) {
  if (!page) return;
  writeClassPrefs(classId, { page });
}

export function writeClassDashboardPrefs(classId, { template, step } = {}) {
  writeClassPrefs(classId, {
    dashboard: {
      template: template || null,
      step: step || null,
    },
  });
}
