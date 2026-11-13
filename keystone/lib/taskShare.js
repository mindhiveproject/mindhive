// Rules for sharing a task, survey or block as an independent copy
// (TaskShareInvite). Kept free of Keystone so they can be tested alone; the
// mutations in mutations/taskShare.ts load the data and call these.
//
// - Class staff (creator, teaching team, mentors) share with the whole class
//   (its students) or with chosen members.
// - Students share with chosen classmates and staff, when the class allows
//   it (Class.settings.allowStudentTaskSharing, on unless set to false).
// - Only a task you author or collaborate on can be shared; a copy you
//   received is yours, so it counts.
// - A recipient sees an invite while they are in the class; once accepted it
//   stays theirs.

const idOf = (item) => (item?.id ? String(item.id) : "");
const idsOf = (items) => (items || []).map(idOf).filter(Boolean);

// On SQLite (development) json fields can arrive as strings.
function decodeJson(value) {
  if (typeof value !== "string") return value || null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function studentSharingAllowed(klass) {
  const settings = decodeJson(klass?.settings) || {};
  return settings.allowStudentTaskSharing !== false;
}

function staffIds(klass) {
  return [
    idOf(klass?.creator),
    ...idsOf(klass?.teachingTeam),
    ...idsOf(klass?.mentors),
  ].filter(Boolean);
}

// "staff", "student" or null: how `userId` takes part in `klass`.
function classRole(klass, userId) {
  if (!klass || !userId) return null;
  const me = String(userId);
  if (staffIds(klass).includes(me)) return "staff";
  if (idsOf(klass.students).includes(me)) return "student";
  return null;
}

// Whether `userId` may share from `klass`, and how.
function sharingRights(klass, userId) {
  const role = classRole(klass, userId);
  if (role === "staff") {
    return { role, canShare: true, canShareWithClass: true };
  }
  if (role === "student") {
    const allowed = studentSharingAllowed(klass);
    return { role, canShare: allowed, canShareWithClass: false };
  }
  return { role: null, canShare: false, canShareWithClass: false };
}

function ownsTask(task, userId) {
  if (!task || !userId) return false;
  const me = String(userId);
  return idOf(task.author) === me || idsOf(task.collaborators).includes(me);
}

// People `userId` can pick in `klass`: everyone in the class but themselves.
function pickableMemberIds(klass, userId) {
  const me = String(userId || "");
  return [...new Set([...staffIds(klass), ...idsOf(klass?.students)])].filter(
    (id) => id !== me
  );
}

// Checks a share request; returns an error message, or null when it is fine.
function checkShareRequest({ task, klass, userId, wholeClass, recipientIds }) {
  if (!task) return "This task could not be found.";
  if (!ownsTask(task, userId)) {
    return "You can only share tasks you created or collaborate on.";
  }
  if (!klass) return "This class could not be found.";
  const rights = sharingRights(klass, userId);
  if (!rights.role) return "You are not part of this class.";
  if (!rights.canShare) {
    return "Sharing between students is turned off in this class.";
  }
  if (wholeClass && !rights.canShareWithClass) {
    return "Only the class's teachers and mentors can share with the whole class.";
  }
  const ids = [...new Set((recipientIds || []).map(String))];
  if (!wholeClass && !ids.length) return "Choose at least one person.";
  const pickable = new Set(pickableMemberIds(klass, userId));
  if (ids.some((id) => !pickable.has(id))) {
    return "Everyone you share with must be in this class.";
  }
  return null;
}

// Whether `userId` is someone `invite` was sent to (as the class is now).
function isInviteRecipient(invite, klass, userId) {
  if (!invite || !userId) return false;
  const me = String(userId);
  if (idOf(invite.sender) === me) return false;
  if (invite.wholeClass && idsOf(klass?.students).includes(me)) return true;
  return (
    idsOf(invite.recipients).includes(me) && classRole(klass, me) !== null
  );
}

// The viewer's state on an invite: "sent", "accepted", "declined",
// "pending" or "closed" (withdrawn, or the source task is gone).
function inviteStateFor(invite, userId) {
  const me = String(userId || "");
  if (idOf(invite?.sender) === me) return "sent";
  if (idsOf(invite?.acceptedBy).includes(me)) return "accepted";
  if (invite?.status !== "active" || !invite?.task) return "closed";
  if (idsOf(invite?.declinedBy).includes(me)) return "declined";
  return "pending";
}

// Settings for a shared copy: the source's settings with where it came from.
// Kept out of `copiedFrom`, which marks a study's private copies (the banks
// hide those).
function sharedCopySettings(sourceSettings, { taskId, inviteId, sharedById }) {
  const base = decodeJson(sourceSettings) || {};
  return {
    ...base,
    sharedFrom: {
      taskId: String(taskId),
      inviteId: String(inviteId),
      sharedById: String(sharedById),
    },
  };
}

module.exports = {
  decodeJson,
  studentSharingAllowed,
  classRole,
  sharingRights,
  ownsTask,
  pickableMemberIds,
  checkShareRequest,
  isInviteRecipient,
  inviteStateFor,
  sharedCopySettings,
};
