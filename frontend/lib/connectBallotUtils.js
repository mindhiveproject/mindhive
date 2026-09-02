import { getMatchingQueue } from "./connectPreferenceMatchingPreference";

function rankBonus(rank, totalOpps) {
  if (rank == null) return 0;
  return Math.max(0, totalOpps - rank + 1);
}

export function computeScore(item, totalOpps) {
  const ranks = rankBonus(item.rank, totalOpps) * 10;
  const stars = (item.starRating || 0) * 2;
  return ranks + stars;
}

export function displayName(profile) {
  if (!profile) return "Unknown";
  return (
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.username ||
    "Unknown"
  );
}

export function studentDisplayName(student) {
  if (!student) return "";
  const full = [student.firstName, student.lastName].filter(Boolean).join(" ");
  return full || student.username || "";
}

/** Normalize fan-out team prefs to a single ranked classmate id list. */
export function deriveClassmateOrder(existingTeamPrefs, teamEligibleOppIds) {
  if (!teamEligibleOppIds?.length) return [];

  const byOpp = new Map();
  (existingTeamPrefs || []).forEach((tp) => {
    const oppId = tp.opportunity?.id;
    const tmId = tp.preferredTeammate?.id;
    if (!oppId || !tmId || !teamEligibleOppIds.includes(oppId)) return;
    if (!byOpp.has(oppId)) byOpp.set(oppId, []);
    byOpp.get(oppId).push({ tmId, priority: tp.priority ?? 999 });
  });

  for (const oppId of teamEligibleOppIds) {
    const entries = byOpp.get(oppId);
    if (entries?.length) {
      return entries
        .sort((a, b) => a.priority - b.priority)
        .map((e) => e.tmId);
    }
  }
  return [];
}

export function getTeamEligibleOpportunities(opportunities) {
  return (opportunities || []).filter(
    (o) => o.teamSize > 1 && o.allowsTeamPreferences,
  );
}

/** Team-eligible opps the student selected (favorited or ranked). */
export function getStudentTeamEligibleOpportunities(
  opportunities,
  selectedOppIds,
) {
  const ids =
    selectedOppIds instanceof Set
      ? selectedOppIds
      : new Set(selectedOppIds);
  return getTeamEligibleOpportunities(opportunities).filter((o) => ids.has(o.id));
}

/** Max active classmate picks for UI (largest teamSize − 1). Pass student-scoped opps for student UI; full round for teacher views. */
export function getMaxActiveClassmatePicks(opportunities) {
  const eligible = getTeamEligibleOpportunities(opportunities);
  if (!eligible.length) return 0;
  return Math.max(...eligible.map((o) => (o.teamSize || 1) - 1), 0);
}

export function sliceActiveClassmates(classmateIds, activeCount) {
  if (!activeCount || activeCount <= 0) return [];
  return (classmateIds || []).slice(0, activeCount);
}

function activePickCapForOpportunity(opp) {
  if (!opp || !opp.allowsTeamPreferences || (opp.teamSize || 1) <= 1) return 0;
  return (opp.teamSize || 1) - 1;
}

/** Keep only top (teamSize − 1) prefs per submitter per opportunity. */
export function filterActiveTeamPreferences(teamPreferences, opportunities) {
  const oppById = new Map(
    (opportunities || []).map((o) => [o.id, o]),
  );
  const grouped = new Map();

  (teamPreferences || []).forEach((tp) => {
    const oppId = tp.opportunity?.id;
    const submitterId = tp.submitter?.id;
    if (!oppId || !submitterId) return;
    const key = `${oppId}::${submitterId}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(tp);
  });

  const filtered = [];
  grouped.forEach((prefs, key) => {
    const oppId = key.split("::")[0];
    const cap = activePickCapForOpportunity(oppById.get(oppId));
    if (cap <= 0) return;
    prefs
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
      .slice(0, cap)
      .forEach((tp) => filtered.push(tp));
  });

  return filtered;
}

export function inferBallotQueue(teamPrefsForStudent, preference) {
  const explicit = getMatchingQueue(preference?.studentMatchingPreference);
  if (explicit) return explicit;
  return (teamPrefsForStudent || []).length > 0 ? "team_first" : "project_first";
}

/** Per-opportunity mutual map (used by matching algorithm). */
export function buildMutualTeamPrefMap(teamPreferences, opportunities = []) {
  const activePrefs = filterActiveTeamPreferences(
    teamPreferences,
    opportunities,
  );
  const directed = new Map();
  activePrefs.forEach((tp) => {
    const oppId = tp.opportunity?.id;
    const a = tp.submitter?.id;
    const b = tp.preferredTeammate?.id;
    if (!oppId || !a || !b) return;
    const key = `${oppId}::${a}`;
    if (!directed.has(key)) directed.set(key, new Set());
    directed.get(key).add(b);
  });

  const mutual = new Map();
  directed.forEach((targets, key) => {
    const [oppId, a] = key.split("::");
    targets.forEach((b) => {
      const reverse = directed.get(`${oppId}::${b}`);
      if (reverse?.has(a)) {
        if (!mutual.has(oppId)) mutual.set(oppId, new Map());
        const oppMap = mutual.get(oppId);
        if (!oppMap.has(a)) oppMap.set(a, new Set());
        oppMap.get(a).add(b);
      }
    });
  });
  return mutual;
}

/**
 * Round-level classmate lists keyed by studentId.
 * teamPrefsByStudent: Map<studentId, ConnectTeamPreference[]>
 */
export function buildClassmateListsByStudent(
  teamPrefsByStudent,
  teamEligibleOppIds,
) {
  const lists = new Map();
  teamPrefsByStudent.forEach((prefs, studentId) => {
    lists.set(
      studentId,
      deriveClassmateOrder(prefs, teamEligibleOppIds),
    );
  });
  return lists;
}

export function getClassmateMutualStatus(
  studentId,
  classmateId,
  classmateListsByStudent,
  activePickCount = 0,
) {
  const myList = sliceActiveClassmates(
    classmateListsByStudent.get(studentId) || [],
    activePickCount,
  );
  const theirList = sliceActiveClassmates(
    classmateListsByStudent.get(classmateId) || [],
    activePickCount,
  );
  const iPickThem = myList.includes(classmateId);
  const theyPickMe = theirList.includes(studentId);

  if (iPickThem && theyPickMe) return "mutual";
  if (iPickThem && !theyPickMe) return "one_way";
  if (!iPickThem && theyPickMe) return "received";
  return null;
}

export function summarizeMutualClassmates(
  studentId,
  classmateIds,
  classmateListsByStudent,
  activePickCount = 0,
) {
  let mutual = 0;
  let oneWay = 0;
  let received = 0;

  const myList = sliceActiveClassmates(
    classmateListsByStudent.get(studentId) || [],
    activePickCount,
  );

  (classmateIds || []).forEach((classmateId) => {
    const status = getClassmateMutualStatus(
      studentId,
      classmateId,
      classmateListsByStudent,
      activePickCount,
    );
    if (status === "mutual") mutual += 1;
    else if (status === "one_way") oneWay += 1;
  });

  classmateListsByStudent.forEach((theirPicks, otherId) => {
    if (otherId === studentId) return;
    const theirActive = sliceActiveClassmates(theirPicks, activePickCount);
    if (theirActive.includes(studentId) && !myList.includes(otherId)) {
      received += 1;
    }
  });

  return { mutual, oneWay, received };
}

export function formatPreferenceSummary(pref, t) {
  if (!pref) return null;
  const rankPart = t(
    "matchingRound.preferenceRankStars",
    { rank: pref.rank ?? "—", stars: pref.starRating ?? 0 },
    { default: "rank {{rank}}, {{stars}}★" },
  );
  const comment = (pref.comment || "").trim();
  if (!comment) return rankPart;
  const truncated =
    comment.length > 60 ? `${comment.slice(0, 59)}…` : comment;
  const notePart = t(
    "matchingRound.preferencePrivateNote",
    { note: truncated },
    { default: 'note: "{{note}}"' },
  );
  return `${rankPart} — ${notePart}`;
}

export function buildPrefIndex(preferences, { submittedOnly = false } = {}) {
  const prefIndex = new Map();
  (preferences || [])
    .filter((p) => !submittedOnly || p.status === "submitted")
    .forEach((p) => {
      const studentId = p.submitter?.id;
      if (!studentId) return;
      (p.items || []).forEach((it) => {
        const oppId = it.opportunity?.id;
        if (!oppId) return;
        prefIndex.set(`${studentId}::${oppId}`, it);
      });
    });
  return prefIndex;
}

export function scoreForStudentOpp(studentId, oppId, prefIndex, totalOpps) {
  const item = prefIndex.get(`${studentId}::${oppId}`);
  return item ? computeScore(item, totalOpps) : 0;
}

export function prefForStudentOpp(studentId, oppId, prefIndex) {
  return prefIndex.get(`${studentId}::${oppId}`);
}

export function buildTeamPrefsByStudent(teamPreferences) {
  const map = new Map();
  (teamPreferences || []).forEach((tp) => {
    const submitterId = tp.submitter?.id;
    if (!submitterId) return;
    if (!map.has(submitterId)) map.set(submitterId, []);
    map.get(submitterId).push(tp);
  });
  return map;
}

export function getSubmissionStatus(student, preference, matchForStudent) {
  if (matchForStudent) return "matched";
  if (!preference) return "not_started";
  if (preference.status === "submitted") return "submitted";
  return "draft";
}

export function buildRankedOpportunityList(opportunities, items) {
  const rankByOppId = new Map();
  (items || []).forEach((item) => {
    const oppId = item.opportunity?.id;
    if (!oppId) return;
    rankByOppId.set(oppId, item);
  });

  return [...(opportunities || [])]
    .filter((opp) => rankByOppId.has(opp.id))
    .map((opp) => ({
      opportunity: opp,
      item: rankByOppId.get(opp.id),
    }))
    .sort(
      (a, b) =>
        Number(a.item?.rank ?? 999) - Number(b.item?.rank ?? 999),
    );
}

export function formatQuestionAnswer(answer, questionType) {
  if (answer === undefined || answer === null || answer === "") return "—";
  if (Array.isArray(answer)) return answer.join(", ");
  if (typeof answer === "boolean") return answer ? "Yes" : "No";
  if (typeof answer === "object") return JSON.stringify(answer);
  return String(answer);
}
