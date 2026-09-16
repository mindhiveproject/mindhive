export function taughtClasses(user) {
  const byId = new Map();
  for (const cls of [...(user?.teacherIn || []), ...(user?.teachingTeamIn || [])]) {
    if (cls?.id && !byId.has(cls.id)) byId.set(cls.id, cls);
  }
  return [...byId.values()];
}

export function taughtClassIds(user) {
  return taughtClasses(user).map((cls) => cls.id);
}

export function isClassCreator(myclass, userId) {
  return Boolean(userId && myclass?.creator?.id === userId);
}

export function isClassTeacher(myclass, userId) {
  if (!userId) return false;
  if (myclass?.creator?.id === userId) return true;
  return (myclass?.teachingTeam || []).some((member) => member?.id === userId);
}

export function isClassTeacherOrMentor(myclass, userId) {
  if (isClassTeacher(myclass, userId)) return true;
  return (myclass?.mentors || []).some((mentor) => mentor?.id === userId);
}

export function canManageTeachingTeam(myclass, userId) {
  return isClassTeacher(myclass, userId);
}
