/**
 * Shared opportunity status tones for list/editor steppers and workflow UI.
 *
 * - action: ongoing, needs the current actor (amber)
 * - waiting: ongoing, waiting on someone else (teal)
 * - done: completed (green)
 * - pending: future, not started (grey)
 */

export const OPPORTUNITY_STATUS_TONES = {
  action: {
    background: "#fdf6e8",
    backgroundColor: "#fdf6e8",
    color: "#8a6d3b",
  },
  waiting: {
    background: "#def8fb",
    backgroundColor: "#def8fb",
    color: "var(--MH-Theme-Primary-Dark, #336f8a)",
  },
  done: {
    background: "#e3f4ec",
    backgroundColor: "#e3f4ec",
    color: "#1d6b3a",
  },
  pending: {
    background: "#f3f3f3",
    backgroundColor: "#f3f3f3",
    color: "#a1a1a1",
  },
};

/** Strong fills for numbered workflow circles (not soft chips). */
export const OPPORTUNITY_STATUS_TONE_SOLID = {
  action: {
    background: "#c9922e",
    color: "#ffffff",
    ring: "0 0 0 4px rgba(201, 146, 46, 0.2)",
  },
  waiting: {
    background: "#eef5f9",
    color: "var(--MH-Theme-Primary-Dark, #336f8a)",
    ring: "none",
  },
  done: {
    background: "#1d6b3a",
    color: "#ffffff",
    ring: "none",
  },
  pending: {
    background: "#e6eaee",
    color: "#5f6871",
    ring: "none",
  },
};


/**
 * @param {'action' | 'waiting' | 'done' | 'pending'} tone
 * @param {Record<string, string | number>} [size]
 */
export function opportunityToneChipStyle(tone) {
  const colors = OPPORTUNITY_STATUS_TONES[tone] || OPPORTUNITY_STATUS_TONES.pending;
  return { ...colors };
}

/** Steps on the list stepper that open the opportunity editor when clicked. */
export const OPPORTUNITY_LIST_OPENABLE_STEP_KEYS = new Set([
  "draft",
  "inRevision",
  "returnedWithComments",
]);
