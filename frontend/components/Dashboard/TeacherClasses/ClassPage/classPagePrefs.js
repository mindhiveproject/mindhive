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

const MATCHING_ROUND_PERSISTABLE_PANELS = new Set([
  "review",
  "selected",
  "forms",
  "studentInterest",
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
