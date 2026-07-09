export const STATUS_OPTIONS = [
  { key: "preferences_open", text: "Preferences open", value: "preferences_open" },
  { key: "preferences_closed", text: "Preferences closed", value: "preferences_closed" },
  { key: "matching", text: "Matching", value: "matching" },
  { key: "published", text: "Published", value: "published" },
  { key: "archived", text: "Archived", value: "archived" },
];

export const ALGO_OPTIONS = [
  { key: "stable_matching", text: "Stable matching (Gale-Shapley)", value: "stable_matching" },
  { key: "score_based", text: "Score-based", value: "score_based" },
  { key: "teacher_curated", text: "Teacher-curated", value: "teacher_curated" },
];

export const ALGO_DESCRIPTIONS = {
  stable_matching: {
    title: "Stable matching (Gale-Shapley)",
    body:
      "Produces an assignment where no student-Opportunity pair would both rather swap with another pair. " +
      "Students propose to their top choice; Opportunities tentatively accept up to capacity and reject lower-scoring " +
      "candidates as better ones arrive. Strong fairness guarantees — defensible to students who ask why they didn't get their first pick.",
  },
  score_based: {
    title: "Score-based (greedy)",
    body:
      "Computes a score for every (student, Opportunity) pair from rank (1 = top, weighted ×10) plus stars (×2), " +
      "then walks the sorted candidates and assigns greedily while respecting each Opportunity's capacity. " +
      "Simple and transparent — a teacher can hand-verify any pair's score. May produce slightly less stable groupings than the stable algorithm.",
  },
  teacher_curated: {
    title: "Teacher-curated",
    body:
      "The system proposes ranked candidates per Opportunity but does NOT assign anyone automatically. " +
      "You manually drag students into Opportunities yourself. Best when the round is small or when you have important " +
      "context the algorithm can't see (a student's prior relationship with a mentor, accessibility needs, etc.).",
  },
};

export const EMPTY_FORM = {
  title: "",
  description: "",
  status: "preferences_open",
  openAt: "",
  closeAt: "",
  matchingAlgorithm: "stable_matching",
};

export function toDateInputValue(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function toIsoOrNull(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return null;
  }
}

export function formatDateShort(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export function isExpired(iso) {
  if (!iso) return false;
  try {
    return new Date(iso).getTime() < Date.now();
  } catch {
    return false;
  }
}

function toDateInputValueFromDate(date) {
  return date.toISOString().slice(0, 10);
}

export function buildSuggestedRoundDefaults(classTitle, networkTitle) {
  const today = new Date();
  const closeDate = new Date(today);
  closeDate.setDate(closeDate.getDate() + 28);

  return {
    title: `${classTitle || "Class"} — ${networkTitle || "Network"} matching`,
    description: "",
    status: "preferences_open",
    openAt: toDateInputValueFromDate(today),
    closeAt: toDateInputValueFromDate(closeDate),
    matchingAlgorithm: "stable_matching",
  };
}
