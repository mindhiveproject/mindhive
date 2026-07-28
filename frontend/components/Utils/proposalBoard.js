/**
 * Helpers for proposal/project board classification.
 * Class templates are identified by templateForClasses, not by isTemplate
 * (isTemplate is reserved for platform-wide templates, admin-only).
 */

/**
 * Returns true when the board is used as a class template. Checks BOTH
 * relationships:
 *   - templateForClasses: legacy 1-to-many via Class.templateProposal
 *     (populated for the FIRST template copied into a class)
 *   - templatesForClass: newer many-to-many via Class.classTemplateBoards
 *     (populated by copyProposalBoard for every class-template copy)
 *
 * Checking only templateForClasses (the pre-fix behavior) missed every 2nd+
 * template a teacher copied into the same class, silently disabling the
 * template UI (add-milestone, custom cards, propagation) on those boards.
 *
 * Callers that need this should include both fields in their GraphQL
 * selection set.
 *
 * @param {Object} proposal - Proposal board object
 * @returns {boolean}
 */
export function isClassTemplateBoard(proposal) {
  const legacy = proposal?.templateForClasses;
  const current = proposal?.templatesForClass;
  return (
    (Array.isArray(legacy) && legacy.length > 0) ||
    (Array.isArray(current) && current.length > 0)
  );
}

/**
 * Return the deduped list of classes that treat this board as a template,
 * unioning `templateForClasses` (legacy) and `templatesForClass` (current).
 * Callers must select both fields in their GraphQL query. Preserves the
 * original object shape so callers can still read `.title`, `.code`, etc.
 *
 * @param {Object} proposal - Proposal board object
 * @returns {Array<Object>} unique class rows
 */
export function getClassTemplateClasses(proposal) {
  const legacy = Array.isArray(proposal?.templateForClasses)
    ? proposal.templateForClasses
    : [];
  const current = Array.isArray(proposal?.templatesForClass)
    ? proposal.templatesForClass
    : [];
  const seen = new Set();
  const out = [];
  for (const c of [...legacy, ...current]) {
    if (!c?.id || seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

export function userIsProposalAdmin(user) {
  return (user?.permissions || []).some(
    (permission) =>
      permission?.canManageUsers
      || permission?.name === "ADMIN"
  );
}

export function canDeleteProposalBoard(board, userId, { isAdmin = false } = {}) {
  if (!board?.id || !userId) return false;
  if (isAdmin) return true;
  if (board.isTemplate) return false;

  return (
    board.creator?.id === userId
    || board.author?.id === userId
  );
}
