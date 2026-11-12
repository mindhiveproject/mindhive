// Single rule for what a teacher can do with an item in the card's Linked
// Items picker and with the linked-item chips on the card.
//
// - Owned (author, resource collaborator, or admin): link, preview, edit.
// - An assignment of a class the user staffs (creator, co-teacher, mentor):
//   link, preview, edit/publish, as assignmentUpdateFilter allows server-side.
// - Someone else's resource: link, preview, copy & link. Never edit.
// - Someone else's assignment, of no class the user staffs: preview, copy & link. Not linkable as-is,
//   since student submissions would land on another teacher's assignment.
// - Tasks and studies: link, preview (opens the discover page).
//
// `open` is what a plain click on a linked chip does: edit what you own,
// preview everything else. Copying only ever happens from an explicit action.
//
// TODO(class-networks): items shared through a class network should become
// linkable without ownership; add that source here once networks share
// resources and assignments.

import { isOnTeachingTeamOf } from "./classTeacherUtils";

export function isAdminUser(user) {
  return Boolean(user?.permissions?.some((p) => p?.name === "ADMIN"));
}

// `type` is "assignment" or "resource"; only assignments are editable by the
// staff of their classes (needs the item's `classes { id }`).
export function canEditLinkedItem(item, user, type) {
  if (!item || !user?.id) return false;
  if (isAdminUser(user)) return true;
  if (item.author?.id === user.id) return true;
  if (type === "assignment" && item.classes?.some((c) => isOnTeachingTeamOf(user, c?.id))) {
    return true;
  }
  return Boolean(item.collaborators?.some((c) => c?.id === user.id));
}

export function getLinkedItemPreviewUrl(item, type) {
  if (type === "task") return `/dashboard/discover/tasks?name=${item?.slug}`;
  if (type === "study") return `/dashboard/discover/studies?name=${item?.slug}`;
  return null;
}

export function getLinkedItemActions(item, type, user) {
  if (type === "task" || type === "study") {
    return { link: true, preview: true, edit: false, copy: false, open: "preview" };
  }

  const canEdit = canEditLinkedItem(item, user, type);
  return {
    link: type === "resource" || canEdit,
    preview: true,
    edit: canEdit,
    copy: !canEdit,
    open: canEdit ? "edit" : "preview",
  };
}
