/**
 * Helpers for proposal/project board classification.
 * Class templates are identified by templateForClasses, not by isTemplate
 * (isTemplate is reserved for platform-wide templates, admin-only).
 */

/**
 * Returns true when the board is used as a class template (has at least one
 * class in templateForClasses). Use this for backfill, propagation UI, etc.,
 * instead of proposal.isTemplate.
 *
 * @param {Object} proposal - Proposal board object with optional templateForClasses
 * @returns {boolean}
 */
export function isClassTemplateBoard(proposal) {
  const classes = proposal?.templateForClasses;
  return Array.isArray(classes) && classes.length > 0;
}
