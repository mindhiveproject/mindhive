/**
 * Ownership for class studies/projects follows the app convention:
 * author OR collaborator (see MY_STUDIES / user proposal board queries).
 */
export function userOwnsClassItem(item, userId) {
  if (!userId || !item) return false;
  if (item?.author?.id === userId) return true;
  return (item?.collaborators || []).some((c) => c?.id === userId);
}

export function getUserRoleOnClassItem(item, userId) {
  if (!userId || !item) return null;
  if (item?.author?.id === userId) return "author";
  if ((item?.collaborators || []).some((c) => c?.id === userId)) {
    return "collaborator";
  }
  return null;
}

export function filterOwnedClassItems(items, userId) {
  return (items || []).filter((item) => userOwnsClassItem(item, userId));
}
