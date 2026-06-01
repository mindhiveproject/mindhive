// -----------------------------------------------------------------------------
// Matching algorithms for Connect rounds.
//
// Three strategies are supported, picked via ConnectRound.matchingAlgorithm:
//   - "score_based"    → greedy: sort all (student, opp) pairs by score, place
//                        each student in the best opp that still has capacity.
//                        Cheap, deterministic, ignores conflicts.
//   - "stable_matching" → Gale-Shapley adapted for many-to-one (one opp can
//                        host studentCapacity students). Produces a stable
//                        assignment: no student-opp pair would both rather
//                        swap with their currently-assigned partners.
//   - "teacher_curated" → no auto-assignment; the algorithm just exposes the
//                        candidate scores so the teacher can drag manually.
//
// All three share the same scoring foundation:
//   score = rankBonus * 10  +  starRating * 2  +  teamCoherenceBonus
//
// Team coherence: when a student has a mutual ConnectTeamPreference with
// someone already (or being) placed in an opportunity, both candidates get a
// bonus so the matcher tends to keep mutual pairs together on team projects.
// -----------------------------------------------------------------------------

function rankBonus(rank, totalOpps) {
  if (rank == null) return 0;
  return Math.max(0, totalOpps - rank + 1);
}

export function computeScore(item, totalOpps) {
  const ranks = rankBonus(item.rank, totalOpps) * 10;
  const stars = (item.starRating || 0) * 2;
  return ranks + stars;
}

// Build a Map<studentId, Set<studentId>> of MUTUAL team-preference pairs for
// each opportunity. A pair counts only if both students nominated each other
// for the same opportunity.
function buildMutualTeamPrefMap(teamPreferences) {
  // key: `${opportunityId}::${studentId}` → Set of preferredTeammateIds
  const directed = new Map();
  (teamPreferences || []).forEach((tp) => {
    const oppId = tp.opportunity?.id;
    const a = tp.submitter?.id;
    const b = tp.preferredTeammate?.id;
    if (!oppId || !a || !b) return;
    const key = `${oppId}::${a}`;
    if (!directed.has(key)) directed.set(key, new Set());
    directed.get(key).add(b);
  });

  // Now keep only mutual entries
  // mutual: opportunityId → Map<studentId, Set<studentId>>
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

// Returns a score bonus for student S being placed in opportunity O given the
// set of students CURRENTLY placed in O. The bonus rewards mutual team prefs
// between S and the existing placements.
function teamCoherenceBonus(studentId, opportunityId, currentPlacements, mutualMap) {
  const oppMap = mutualMap.get(opportunityId);
  if (!oppMap) return 0;
  const myPrefs = oppMap.get(studentId);
  if (!myPrefs) return 0;
  let bonus = 0;
  for (const otherId of currentPlacements) {
    if (myPrefs.has(otherId)) bonus += 5;
  }
  return bonus;
}

// Greedy: walk all candidates sorted desc by score; place each student in the
// highest-scoring opportunity that still has capacity.
function greedyAssign(candidates, opportunities, mutualMap) {
  const opportunityFill = new Map();
  const opportunityStudents = new Map();
  const studentMatched = new Set();
  const matches = [];

  // Re-sort with team coherence factored in. Because team bonus depends on
  // who's already placed, we walk in order and recompute on the fly: each
  // candidate gets its baseline + current bonus.
  const baseSorted = [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.rank ?? 999) - (b.rank ?? 999);
  });

  for (const c of baseSorted) {
    if (studentMatched.has(c.studentId)) continue;
    const opp = opportunities.find((o) => o.id === c.opportunityId);
    if (!opp) continue;
    const cap = opp.studentCapacity || 1;
    const filled = opportunityFill.get(c.opportunityId) || 0;
    if (filled >= cap) continue;

    const placements = opportunityStudents.get(c.opportunityId) || new Set();
    const bonus = teamCoherenceBonus(
      c.studentId,
      c.opportunityId,
      placements,
      mutualMap,
    );
    matches.push({ ...c, score: c.score + bonus });
    opportunityFill.set(c.opportunityId, filled + 1);
    placements.add(c.studentId);
    opportunityStudents.set(c.opportunityId, placements);
    studentMatched.add(c.studentId);
  }

  return { matches, studentMatched };
}

// Gale-Shapley adapted for many-to-one. Students "propose" to opportunities
// in order of their own preference (highest score → lowest); each opportunity
// keeps the top studentCapacity proposers it has seen so far and rejects the
// rest. Loops until stable.
//
// Time complexity: O(students × opportunities) — fine at the scale this runs.
function galeShapleyAssign(candidates, opportunities, mutualMap) {
  // Group candidates by student, sorted by desc score.
  const byStudent = new Map();
  candidates.forEach((c) => {
    if (!byStudent.has(c.studentId)) byStudent.set(c.studentId, []);
    byStudent.get(c.studentId).push(c);
  });
  byStudent.forEach((arr) => {
    arr.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.rank ?? 999) - (b.rank ?? 999);
    });
  });

  // Opportunity capacities + current tentative placements
  const capacity = new Map();
  const placements = new Map(); // oppId → Array<{studentId, score}>
  opportunities.forEach((o) => {
    capacity.set(o.id, o.studentCapacity || 1);
    placements.set(o.id, []);
  });

  // Tracks the next preference index each student will propose to.
  const proposalIndex = new Map();
  const studentList = Array.from(byStudent.keys());
  studentList.forEach((s) => proposalIndex.set(s, 0));

  // Worklist: students who still need a match.
  let unassigned = new Set(studentList);
  let iter = 0;
  const maxIter = studentList.length * 10; // safety

  while (unassigned.size > 0 && iter < maxIter) {
    iter += 1;
    for (const sid of Array.from(unassigned)) {
      const prefs = byStudent.get(sid) || [];
      const idx = proposalIndex.get(sid);
      if (idx >= prefs.length) {
        // Exhausted preferences; remains unassigned.
        unassigned.delete(sid);
        continue;
      }
      const prop = prefs[idx];
      proposalIndex.set(sid, idx + 1);

      const oppId = prop.opportunityId;
      const cap = capacity.get(oppId) || 1;
      const slot = placements.get(oppId) || [];

      // Score with team coherence factored against current slot members.
      const currentMemberIds = new Set(slot.map((s) => s.studentId));
      const bonus = teamCoherenceBonus(sid, oppId, currentMemberIds, mutualMap);
      const effectiveScore = prop.score + bonus;

      slot.push({ studentId: sid, score: effectiveScore, rank: prop.rank });
      // Keep only the top `cap` by score. Ties broken by lower rank.
      slot.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (a.rank ?? 999) - (b.rank ?? 999);
      });
      const rejected = slot.splice(cap);
      placements.set(oppId, slot);

      // Anyone displaced rejoins the unassigned worklist.
      unassigned.delete(sid);
      rejected.forEach((r) => unassigned.add(r.studentId));
    }
  }

  const matches = [];
  const studentMatched = new Set();
  placements.forEach((slot, oppId) => {
    slot.forEach((s) => {
      matches.push({
        studentId: s.studentId,
        opportunityId: oppId,
        score: s.score,
        rank: s.rank ?? null,
      });
      studentMatched.add(s.studentId);
    });
  });

  return { matches, studentMatched };
}

export function runMatching(round, { includeDrafts = false } = {}) {
  const opportunities = round?.opportunities || [];
  const preferences = round?.preferences || [];
  const totalOpps = opportunities.length;
  const algorithm = round?.matchingAlgorithm || "stable_matching";

  const activePrefs = preferences.filter(
    (p) => p.status === "submitted" || (includeDrafts && p.status === "draft"),
  );

  const candidates = [];
  activePrefs.forEach((pref) => {
    if (!pref.submitter?.id) return;
    (pref.items || []).forEach((item) => {
      if (!item.opportunity?.id) return;
      if (
        item.rank == null &&
        (item.starRating == null || item.starRating === 0)
      ) {
        return;
      }
      candidates.push({
        studentId: pref.submitter.id,
        opportunityId: item.opportunity.id,
        score: computeScore(item, totalOpps),
        rank: item.rank ?? null,
      });
    });
  });

  const mutualMap = buildMutualTeamPrefMap(round?.teamPreferences);

  let result;
  if (algorithm === "teacher_curated") {
    // No auto-assignment — algorithm just surfaces candidates so the teacher
    // can manually drag them. We return an empty match list and the full set
    // of students with preferences so the teacher sees the unmatched section.
    result = { matches: [], studentMatched: new Set() };
  } else if (algorithm === "stable_matching") {
    result = galeShapleyAssign(candidates, opportunities, mutualMap);
  } else {
    result = greedyAssign(candidates, opportunities, mutualMap);
  }

  const studentsWithPrefs = new Set(
    activePrefs.map((p) => p.submitter?.id).filter(Boolean),
  );
  const unmatchedStudents = Array.from(studentsWithPrefs).filter(
    (id) => !result.studentMatched.has(id),
  );

  return { matches: result.matches, unmatchedStudents };
}
