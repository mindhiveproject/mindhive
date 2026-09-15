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

function idsFromRelList(items: unknown): string[] {
  const list = Array.isArray(items) ? items : items ? [items] : [];
  return list
    .map((item) =>
      item && typeof item === "object" && "id" in item
        ? String((item as { id?: unknown }).id || "")
        : ""
    )
    .filter(Boolean);
}

export function relationshipConnectIds(rel: unknown): string[] {
  if (!rel || typeof rel !== "object") return [];
  return idsFromRelList((rel as { connect?: unknown }).connect);
}

/** IDs from `connect` or `set` (not `disconnect`). */
export function relationshipAssignedIds(rel: unknown): string[] {
  if (!rel || typeof rel !== "object") return [];
  const obj = rel as { connect?: unknown; set?: unknown };
  return [...new Set([...idsFromRelList(obj.connect), ...idsFromRelList(obj.set)])];
}

type RoundWithReviewers = {
  id?: string | null;
  reviewers?: { id?: string | null }[] | null;
};

async function connectMissingReviewers(
  context: any,
  rounds: RoundWithReviewers[],
  profileIds: string[]
) {
  const ids = [...new Set(profileIds.filter(Boolean))];
  if (ids.length === 0) return;

  for (const round of rounds) {
    if (!round?.id) continue;
    const existing = new Set(
      (round.reviewers || []).map((reviewer) => reviewer?.id).filter(Boolean) as string[]
    );
    const toConnect = ids.filter((id) => !existing.has(id));
    if (toConnect.length === 0) continue;
    await context.sudo().query.ConnectRound.updateOne({
      where: { id: String(round.id) },
      data: {
        reviewers: { connect: toConnect.map((id) => ({ id })) },
      },
    });
  }
}

/** Connect class teachers and mentors as reviewers on every round in the class's networks. */
export async function syncClassStaffAsRoundReviewers(
  context: any,
  classId: string | null | undefined
) {
  if (!classId) return;
  const klass = await context.sudo().query.Class.findOne({
    where: { id: classId },
    query: `
      ${CLASS_STAFF_QUERY}
      networks {
        connectRounds { id reviewers { id } }
      }
    `,
  });
  if (!klass) return;

  const rounds = (klass.networks || []).flatMap(
    (network: { connectRounds?: RoundWithReviewers[] | null }) =>
      network?.connectRounds || []
  );
  await connectMissingReviewers(context, rounds, classStaffIds(klass));
}

/** Connect staff of every class on a network as reviewers of that network's rounds. */
export async function syncNetworkClassStaffAsRoundReviewers(
  context: any,
  networkId: string | null | undefined
) {
  if (!networkId) return;
  const network = await context.sudo().query.ClassNetwork.findOne({
    where: { id: networkId },
    query: `
      id
      classes { ${CLASS_STAFF_QUERY} }
      connectRounds { id reviewers { id } }
    `,
  });
  if (!network) return;

  const staffIds = [
    ...new Set(
      (network.classes || []).flatMap((klass: ClassStaffShape) => classStaffIds(klass))
    ),
  ];
  await connectMissingReviewers(context, network.connectRounds || [], staffIds);
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
