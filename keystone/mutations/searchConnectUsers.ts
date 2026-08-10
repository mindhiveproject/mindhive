// Case-insensitive Connect Bank people search.
// GraphQL StringFilter.mode is Postgres-only; local Keystone uses SQLite, so
// the frontend cannot send mode: insensitive. These resolvers apply Prisma
// contains (+ mode on Postgres) server-side instead.

const CONNECT_ROLES = ["ADMIN", "TEACHER", "SCIENTIST", "MENTOR"] as const;

const SEARCH_FIELDS = [
  "username",
  "publicReadableId",
  "publicId",
  "firstName",
  "lastName",
  "location",
  "organization",
  "bio",
  "bioInformal",
] as const;

function isSqliteProvider() {
  return process.env.NODE_ENV === "development";
}

function stringContains(q: string) {
  if (isSqliteProvider()) {
    return { contains: q };
  }
  return { contains: q, mode: "insensitive" as const };
}

export function connectUsersWhere(search?: string | null) {
  const trimmed = (search || "").trim();
  const and: Record<string, unknown>[] = [
    { isPublic: { equals: true } },
    {
      permissions: {
        some: {
          name: { in: [...CONNECT_ROLES] },
        },
      },
    },
  ];

  if (trimmed) {
    const contains = stringContains(trimmed);
    and.push({
      OR: [
        ...SEARCH_FIELDS.map((field) => ({ [field]: contains })),
        { interests: { some: { title: contains } } },
      ],
    });
  }

  return { AND: and };
}

function requireSession(context: any) {
  if (!context.session?.itemId) {
    throw new Error("You must be signed in.");
  }
}

export async function searchConnectUsers(
  _root: unknown,
  {
    skip,
    take,
    search,
  }: { skip?: number | null; take?: number | null; search?: string | null },
  context: any
) {
  requireSession(context);
  const where = connectUsersWhere(search);
  return context.prisma.profile.findMany({
    where,
    skip: skip ?? 0,
    take: take ?? undefined,
  });
}

export async function searchConnectUsersCount(
  _root: unknown,
  { search }: { search?: string | null },
  context: any
) {
  requireSession(context);
  return context.prisma.profile.count({
    where: connectUsersWhere(search),
  });
}
