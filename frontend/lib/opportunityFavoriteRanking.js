/**
 * Helpers for keeping student opportunity favorites and ranking membership aligned.
 */

/** Round-scoped favorite IDs from the authoritative Profile relation. */
export function getFavoriteOppIdsInRound(favoriteOpportunities, roundOpportunityIds) {
  const roundSet =
    roundOpportunityIds instanceof Set
      ? roundOpportunityIds
      : new Set(roundOpportunityIds || []);
  const ids = new Set();
  (favoriteOpportunities || [])
    .map((o) => o?.id)
    .filter((id) => id && roundSet.has(id))
    .forEach((id) => ids.add(id));
  return ids;
}

/** True when ranking should reflect a frozen preference snapshot. */
export function isPreferenceSnapshotLocked({ preferenceStatus, isOpen }) {
  if (preferenceStatus === "submitted") return true;
  if (!isOpen) return true;
  return false;
}

/** True when a round accepts new draft ranking edits (status + time window). */
export function isRoundRankingEditable(round) {
  if (!round || round.status !== "preferences_open") return false;
  const now = Date.now();
  const openAtMs = round.openAt ? new Date(round.openAt).getTime() : null;
  const closeAtMs = round.closeAt ? new Date(round.closeAt).getTime() : null;
  const beforeOpen = openAtMs && now < openAtMs;
  const afterClose = closeAtMs && now > closeAtMs;
  return !beforeOpen && !afterClose;
}

/** Draft ranking items that no longer match favorites on class browse. */
export function getBrowseDraftDriftEntries({
  connectPreferences,
  favoriteOpportunities,
  roundOpportunityIdsByRoundId,
  openRoundsById,
}) {
  const drifted = new Map();

  (connectPreferences || []).forEach((pref) => {
    if (pref?.status !== "draft") return;
    const roundId = pref?.round?.id;
    if (!roundId) return;

    const round = openRoundsById?.get(roundId);
    if (!round || round.status !== "preferences_open") return;

    const roundOppIds = roundOpportunityIdsByRoundId?.get(roundId);
    if (!roundOppIds) return;

    const favoriteOppIdsInRound = getFavoriteOppIdsInRound(
      favoriteOpportunities,
      roundOppIds,
    );
    getDraftDriftedOpportunityIds({
      favoriteOppIdsInRound,
      existingPreference: pref,
      isSnapshotLocked: false,
    }).forEach((entry) => {
      if (!drifted.has(entry.oppId)) {
        drifted.set(entry.oppId, entry);
      }
    });
  });

  return Array.from(drifted.values());
}

/**
 * Canonical opportunity IDs shown in the ranking UI.
 * Editable drafts: favorites in round only.
 * Locked snapshots: saved preference items only.
 */
export function deriveRankingOpportunityIds({
  favoriteOppIdsInRound,
  existingPreference,
  isSnapshotLocked,
}) {
  if (isSnapshotLocked) {
    const ids = new Set();
    (existingPreference?.items || [])
      .map((item) => item.opportunity?.id)
      .filter(Boolean)
      .forEach((id) => ids.add(id));
    return ids;
  }
  return new Set(favoriteOppIdsInRound);
}

/** Draft items whose opportunity is no longer favorited in this round. */
export function getDraftDriftedOpportunityIds({
  favoriteOppIdsInRound,
  existingPreference,
  isSnapshotLocked,
  localRankings = null,
}) {
  if (isSnapshotLocked) return [];

  const drifted = new Map();
  (existingPreference?.items || []).forEach((item) => {
    const oppId = item.opportunity?.id;
    if (!oppId) return;
    if (!favoriteOppIdsInRound.has(oppId)) {
      drifted.set(oppId, {
        oppId,
        itemId: item.id,
      });
    }
  });

  if (localRankings) {
    Object.entries(localRankings).forEach(([oppId, ranking]) => {
      if (favoriteOppIdsInRound.has(oppId)) return;
      const hasRankData =
        ranking &&
        ((ranking.rank !== "" && ranking.rank != null) ||
          (ranking.starRating !== "" && ranking.starRating != null) ||
          (ranking.comment || "").trim());
      if (hasRankData && !drifted.has(oppId)) {
        drifted.set(oppId, { oppId, itemId: null });
      }
    });
  }

  return Array.from(drifted.values());
}

/** Drop ranking keys not in the canonical set and compact sequential ranks. */
export function pruneRankingsToOpportunityIds(rankings, allowedOppIds) {
  const allowed =
    allowedOppIds instanceof Set ? allowedOppIds : new Set(allowedOppIds);
  const next = {};
  Object.entries(rankings || {}).forEach(([oppId, value]) => {
    if (allowed.has(oppId)) {
      next[oppId] = value;
    }
  });

  const ordered = Object.entries(next)
    .filter(([, r]) => r?.rank !== "" && r?.rank != null)
    .sort((a, b) => Number(a[1].rank) - Number(b[1].rank));

  ordered.forEach(([oppId, value], index) => {
    next[oppId] = { ...value, rank: index + 1 };
  });

  return next;
}

/** Filter save payload to canonical membership for editable drafts. */
export function filterRankingEntriesForSave(
  rankings,
  allowedOppIds,
  { isSnapshotLocked },
) {
  const entries = Object.entries(rankings || {}).filter(
    ([, r]) =>
      r &&
      (r.rank !== "" || r.starRating !== "" || (r.comment || "").trim()),
  );
  if (isSnapshotLocked) {
    return entries;
  }
  const allowed =
    allowedOppIds instanceof Set ? allowedOppIds : new Set(allowedOppIds);
  return entries.filter(([oppId]) => allowed.has(oppId));
}
