function rankBonus(rank, totalOpps) {
  if (rank == null) return 0;
  return Math.max(0, totalOpps - rank + 1);
}

export function computeScore(item, totalOpps) {
  const ranks = rankBonus(item.rank, totalOpps) * 10;
  const stars = (item.starRating || 0) * 2;
  return ranks + stars;
}

export function runMatching(round, { includeDrafts = false } = {}) {
  const opportunities = round?.opportunities || [];
  const preferences = round?.preferences || [];
  const totalOpps = opportunities.length;

  const activePrefs = preferences.filter(
    (p) => p.status === "submitted" || (includeDrafts && p.status === "draft")
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

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.rank ?? 999) - (b.rank ?? 999);
  });

  const opportunityFill = new Map();
  const studentMatched = new Set();
  const matches = [];

  for (const c of candidates) {
    if (studentMatched.has(c.studentId)) continue;
    const opp = opportunities.find((o) => o.id === c.opportunityId);
    if (!opp) continue;
    const cap = opp.studentCapacity || 1;
    const filled = opportunityFill.get(c.opportunityId) || 0;
    if (filled >= cap) continue;

    matches.push(c);
    opportunityFill.set(c.opportunityId, filled + 1);
    studentMatched.add(c.studentId);
  }

  const studentsWithPrefs = new Set(
    activePrefs.map((p) => p.submitter?.id).filter(Boolean)
  );
  const unmatchedStudents = Array.from(studentsWithPrefs).filter(
    (id) => !studentMatched.has(id)
  );

  return { matches, unmatchedStudents };
}
