export const CLASS_STAFF_QUERY =
  "id creator { id } teachingTeam { id } mentors { id }";

export type ClassStaffShape = {
  creator?: { id?: string | null } | null;
  teachingTeam?: { id?: string | null }[] | null;
  mentors?: { id?: string | null }[] | null;
};

/** Creator, co-teachers, and class mentors. */
export function classStaffIds(klass: ClassStaffShape | null | undefined) {
  return [
    klass?.creator?.id,
    ...(klass?.teachingTeam || []).map((member) => member?.id),
    ...(klass?.mentors || []).map((mentor) => mentor?.id),
  ].filter(Boolean) as string[];
}

export function isClassStaff(
  klass: ClassStaffShape | null | undefined,
  userId: string | null | undefined
) {
  if (!userId) return false;
  return classStaffIds(klass).includes(userId);
}

export function isClassTeacherSet(
  klass: ClassStaffShape | null | undefined,
  userId: string | null | undefined
) {
  if (!userId) return false;
  if (klass?.creator?.id === userId) return true;
  return (klass?.teachingTeam || []).some((member) => member?.id === userId);
}

export function relationshipConnectIds(rel: unknown): string[] {
  if (!rel || typeof rel !== "object") return [];
  const connect = (rel as { connect?: unknown }).connect;
  if (!connect) return [];
  const items = Array.isArray(connect) ? connect : [connect];
  return items
    .map((item) =>
      item && typeof item === "object" && "id" in item
        ? String((item as { id?: unknown }).id || "")
        : ""
    )
    .filter(Boolean);
}

/** Grant platform TEACHER if the profile does not already have it. */
export async function ensureTeacherPermission(context: any, profileId: string) {
  if (!profileId) return;
  const profile = await context.sudo().query.Profile.findOne({
    where: { id: profileId },
    query: "id permissions { name }",
  });
  if (!profile) return;
  if ((profile.permissions || []).some((p: { name?: string }) => p?.name === "TEACHER")) {
    return;
  }
  await context.sudo().query.Profile.updateOne({
    where: { id: profileId },
    data: { permissions: { connect: [{ name: "TEACHER" }] } },
  });
}
