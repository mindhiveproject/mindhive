/**
 * Pure template↔clone row matching for proposal board propagation.
 *
 * Matching rules (claimed-set aware):
 * - Template row with a publicId → match that id on an unclaimed clone row;
 *   no match means the row is new (caller should create).
 * - Template row without a publicId → pair with the next unclaimed clone row
 *   that also has no publicId (position order among that leftover subset).
 *   Never create a copy of a publicId-less template row while such a leftover
 *   still exists; if none remain, do not create (skip).
 *
 * Empty string counts as missing publicId.
 *
 * Scenario checks: node mutations/utils/boardPropagationMatch.scenarios.js
 *
 * Manual checklist after deploy:
 * 1. Open a small class template that already has student clones.
 * 2. Add a dummy section; with auto-update on (or click Save & Update).
 * 3. Confirm each student board gets exactly ONE new column.
 * 4. Delete the dummy section and confirm that one column is removed.
 * 5. Do not use boards that already have duplicate columns as the test.
 */

/**
 * @param {string | null | undefined} value
 * @returns {value is string}
 */
function hasPublicId(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Decide how each template row maps onto clone rows. Clone rows are assumed
 * already sorted by position. Each clone row is claimed at most once.
 *
 * @template {{ id: string, publicId?: string | null, position?: number | null }} T
 * @template {{ id: string, publicId?: string | null, position?: number | null }} C
 * @param {T[]} templateRows
 * @param {C[]} cloneRows
 * @returns {Array<{ template: T, decision:
 *   | { action: "update", clone: C, needsSharedPublicId: boolean }
 *   | { action: "create" }
 *   | { action: "skip" }
 * }>}
 */
function planRowMatches(templateRows, cloneRows) {
  const claimed = new Set();
  const results = [];

  for (const template of templateRows) {
    if (hasPublicId(template.publicId)) {
      const byPublicId = cloneRows.find(
        (c) =>
          !claimed.has(c.id) &&
          hasPublicId(c.publicId) &&
          c.publicId === template.publicId
      );
      if (byPublicId) {
        claimed.add(byPublicId.id);
        results.push({
          template,
          decision: {
            action: "update",
            clone: byPublicId,
            needsSharedPublicId: false,
          },
        });
      } else {
        results.push({ template, decision: { action: "create" } });
      }
      continue;
    }

    // Legacy / empty publicId: pair with next unclaimed empty-id clone row.
    const leftover = cloneRows.find(
      (c) => !claimed.has(c.id) && !hasPublicId(c.publicId)
    );
    if (leftover) {
      claimed.add(leftover.id);
      results.push({
        template,
        decision: {
          action: "update",
          clone: leftover,
          needsSharedPublicId: true,
        },
      });
    } else {
      // No leftover empty clone — do not create another copy of a
      // publicId-less template row (would restart the duplication loop).
      results.push({ template, decision: { action: "skip" } });
    }
  }

  return results;
}

module.exports = {
  hasPublicId,
  planRowMatches,
};
