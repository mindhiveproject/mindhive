// access functions, the access control returns yes or no

import { permissionsList } from "./schemas/fields";
import { ListAccessArgs, Session } from "./types";
import { Prisma } from "@prisma/client";
import { requestScope } from "./lib/requestScope";

export function isSignedIn({ session }: ListAccessArgs) {
  return !!session; // if undefinened, return false
}

const generatedPermissions = Object.fromEntries(
  permissionsList.map((permission) => [
    permission,
    function ({ session }: ListAccessArgs) {
      return (
        session?.data.permissions
          ?.map((role) => role[permission])
          .filter((p) => !!p).length > 0
      );
    },
  ])
);

// Permissions check if someone meets a criteria - yes or no
// Issue #7: removed hardcoded `isAwesome` username bypass; use the
// canAccessAdminUI permission flag stored on the user's Role instead.
const TICKET_ROLE_NAMES = ["ADMIN", "TESTER"];

export const permissions = {
  ...generatedPermissions,
  // ADMIN keeps the stored flag. TESTER is granted the same ticket access by name.
  canManageTickets({ session }: ListAccessArgs) {
    return (
      generatedPermissions.canManageTickets({ session }) ||
      !!session?.data.permissions?.some((role) =>
        TICKET_ROLE_NAMES.includes(role?.name)
      )
    );
  },
};

/** Admin UI operators who may manage network memberships and invites. */
export function canAdminManageNetworks({ session }: ListAccessArgs) {
  return (
    permissions.canManageUsers({ session }) ||
    permissions.canAccessAdminUI({ session })
  );
}

/** Teachers/mentors/reviewers who may read student ballot data for a round. */
function connectRoundStaffRoundClauses(me: string) {
  return [
    { createdBy: { id: { equals: me } } },
    { reviewers: { some: { id: { equals: me } } } },
    { classNetwork: { creator: { id: { equals: me } } } },
    { classNetwork: { admins: { some: { id: { equals: me } } } } },
    {
      classNetwork: {
        classes: { some: { creator: { id: { equals: me } } } },
      },
    },
    {
      classNetwork: {
        classes: { some: { teachingTeam: { some: { id: { equals: me } } } } },
      },
    },
    {
      classNetwork: {
        classes: { some: { mentors: { some: { id: { equals: me } } } } },
      },
    },
  ];
}

function classStaffSome(me: string) {
  return {
    OR: [
      { creator: { id: { equals: me } } },
      { teachingTeam: { some: { id: { equals: me } } } },
      { mentors: { some: { id: { equals: me } } } },
    ],
  };
}

/** Platform user admins (the canManageUsers permission). */
export function isAdmin({ session }: ListAccessArgs) {
  return !!permissions.canManageUsers({ session });
}

/**
 * Class filter: classes where the session user is creator, co-teacher or
 * mentor. Admins match every class; anonymous callers match none.
 */
export function classStaffFilter({ session }: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (isAdmin({ session })) return true;
  return classStaffSome(session.itemId);
}

/**
 * Operation access for lists anyone may read but only signed-in users may
 * change. Per-item ownership is added with filters where it applies.
 */
export const signedInWrites = {
  query: () => true,
  create: isSignedIn,
  update: isSignedIn,
  delete: isSignedIn,
};

function authorOrCollaboratorWhere(me: string) {
  return {
    OR: [
      { author: { id: { equals: me } } },
      { collaborators: { some: { id: { equals: me } } } },
    ],
  };
}

/** Filter: items the session user authored or collaborates on; admins: all. */
export function authorOrCollaboratorFilter({ session }: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (isAdmin({ session })) return true;
  return authorOrCollaboratorWhere(String(session.itemId));
}

/** Filter: items the session user authored; admins: all. */
export function authorFilter({ session }: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (isAdmin({ session })) return true;
  return { author: { id: { equals: String(session.itemId) } } };
}

/**
 * Filter for records owned through their `study` relation (StudyImage,
 * StudyVersion, StudyDataSource): the study's author or collaborators.
 */
export function studyEditorFilter({ session }: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (isAdmin({ session })) return true;
  return { study: authorOrCollaboratorWhere(String(session.itemId)) };
}

/**
 * Study updates: author, collaborators, and staff of a class the study is
 * linked to or whose students author it (class dashboards assign students to
 * studies and change submission status).
 */
export function studyUpdateFilter({ session }: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (isAdmin({ session })) return true;
  const me = String(session.itemId);
  const staffClass = { some: classStaffSome(me) };
  return {
    OR: [
      ...authorOrCollaboratorWhere(me).OR,
      { classes: staffClass },
      { author: { studentIn: staffClass } },
      { collaborators: { some: { studentIn: staffClass } } },
    ],
  };
}

// ---------------------------------------------------------------------------
// Per-request id lookups for the read filters below.
//
// These filters used to express membership as nested relation chains (e.g.
// assignment → card → section → board → class → students). Prisma turns each
// chain into nested subqueries that run for every row, and again for every
// relation a response resolves, which made board and card loads slow. Instead
// each filter looks up the session user's ids once — classes they staff or
// study in, networks they are connected to — and filters
// with `id in [...]`. The rules are unchanged; only the SQL is cheaper.
//
// Lookups are cached per HTTP request (queries and mutations). Any write to a
// model these lookups read — class/network membership (Class, ClassNetwork,
// Profile) and the board → section → card → assignment chain — or any raw SQL
// write clears that request's cache once the write completes, so a mutation
// that changes them and then reads in the same request sees the new state. Clearing happens in Prisma middleware
// (attachAccessCacheInvalidation), which sees every write: context.db,
// context.query, sudo and raw. Without the cache, mutations that run many
// access checks (copyProposalBoard: hundreds) re-ran these lookups for each
// check and exhausted the database connection pool.
// ---------------------------------------------------------------------------

const idLookupCache = new WeakMap<object, Map<string, Promise<string[]>>>();

function cachedIds(
  context: any,
  key: string,
  compute: () => Promise<string[]>
): Promise<string[]> {
  const req = context?.req;
  if (!req) return compute();
  let cache = idLookupCache.get(req);
  if (!cache) {
    cache = new Map();
    idLookupCache.set(req, cache);
  }
  const cached = cache.get(key);
  if (cached) return cached;
  const lookup = compute();
  cache.set(key, lookup);
  return lookup;
}

const ACCESS_INPUT_MODELS = new Set([
  "Class",
  "ClassNetwork",
  "Profile",
  "ProposalBoard",
  "ProposalSection",
  "ProposalCard",
  "Assignment",
  "Homework",
  "Study",
]);
const WRITE_ACTIONS = new Set([
  "create",
  "createMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
  "executeRaw",
  "executeRawUnsafe",
]);

/** Prisma middleware: clears the request's id cache after writes it depends on. */
export function attachAccessCacheInvalidation(prisma: any) {
  prisma.$use(async (params: any, next: (p: any) => Promise<any>) => {
    try {
      return await next(params);
    } finally {
      const isWrite = WRITE_ACTIONS.has(params.action);
      const touchesInputs = !params.model || ACCESS_INPUT_MODELS.has(params.model);
      if (isWrite && touchesInputs) {
        const req = requestScope.getStore()?.req;
        if (req) idLookupCache.delete(req);
      }
    }
  });
}

/** Ids of `listKey` items matching `where`, read as sudo. */
async function findIds(context: any, listKey: string, where: any) {
  const rows = await context.sudo().query[listKey].findMany({
    where,
    query: "id",
  });
  return rows.map((row: { id: string }) => String(row.id));
}

/** Ids of classes where the session user is creator, co-teacher or mentor. */
export function staffClassIds(context: any): Promise<string[]> {
  const me = context?.session?.itemId;
  if (!me) return Promise.resolve([]);
  return cachedIds(context, "staffClasses", () =>
    findIds(context, "Class", classStaffSome(String(me)))
  );
}

/** Ids of classes where the session user is a student. */
function studentClassIds(context: any): Promise<string[]> {
  const me = context?.session?.itemId;
  if (!me) return Promise.resolve([]);
  return cachedIds(context, "studentClasses", () =>
    findIds(context, "Class", {
      students: { some: { id: { equals: String(me) } } },
    })
  );
}

/** Ids of classes the session user belongs to (classMemberWhere). */
async function memberClassIds(context: any): Promise<string[]> {
  const [staff, student] = await Promise.all([
    staffClassIds(context),
    studentClassIds(context),
  ]);
  return [...new Set([...staff, ...student])];
}

/**
 * Ids of class networks the session user is connected to: creator, admin,
 * member profile, public networks, and networks of their classes.
 */
function connectedNetworkIds(context: any): Promise<string[]> {
  const me = context?.session?.itemId;
  if (!me) return Promise.resolve([]);
  return cachedIds(context, "connectedNetworks", async () => {
    const memberIds = await memberClassIds(context);
    const meId = String(me);
    return findIds(context, "ClassNetwork", {
      OR: [
        { creator: { id: { equals: meId } } },
        { admins: { some: { id: { equals: meId } } } },
        { memberProfiles: { some: { id: { equals: meId } } } },
        { isPublic: { equals: true } },
        ...(memberIds.length
          ? [{ classes: { some: { id: { in: memberIds } } } }]
          : []),
      ],
    });
  });
}

/**
 * Boards whose cards (and linked assignments) the session user may use:
 * their own, collaborations, class boards and class templates of a class
 * they belong to, platform templates and default boards.
 *
 * Matched by the user's class ids rather than by a list of board ids: a
 * teacher's usable boards include every student board in every class they
 * ever taught (thousands of ids), while their class list stays short.
 */
async function usableBoardWhere(context: any) {
  const me = String(context?.session?.itemId);
  const memberIds = await memberClassIds(context);
  const inMemberClass = { some: { id: { in: memberIds } } };
  return {
    OR: [
      { author: { id: { equals: me } } },
      { collaborators: { some: { id: { equals: me } } } },
      ...(memberIds.length
        ? [
            { usedInClass: { id: { in: memberIds } } },
            { templatesForClass: inMemberClass },
            { templateForClasses: inMemberClass },
          ]
        : []),
      { isTemplate: { equals: true } },
      { isDefault: { equals: true } },
    ],
  };
}

/**
 * Ids of assignments linked to a card on a board the session user may use
 * (usableBoardWhere).
 *
 * Computed in two plain steps — the usable board ids, then one indexed join
 * section → card → assignment link — rather than as a Prisma relation filter
 * on Assignment (proposalCards → section → board). Postgres ran that nested
 * filter by re-joining every card with every section for each card row: 5–10 s
 * per card open in production, and minutes on larger data.
 */
function boardAssignmentIds(context: any): Promise<string[]> {
  return cachedIds(context, "boardAssignments", async () =>
    assignmentIdsOnBoards(context, await usableBoardWhere(context))
  );
}

/**
 * Ids of assignments linked to a card on a board the session user owns or
 * collaborates on, or a class template board of a class they staff — the
 * boards whose linked assignments they may edit (assignmentUpdateFilter).
 */
function ownedBoardAssignmentIds(context: any): Promise<string[]> {
  return cachedIds(context, "ownedBoardAssignments", async () => {
    const me = String(context?.session?.itemId);
    const staffIds = await staffClassIds(context);
    return assignmentIdsOnBoards(context, {
      OR: [
        { author: { id: { equals: me } } },
        { collaborators: { some: { id: { equals: me } } } },
        ...(staffIds.length
          ? [{ templatesForClass: { some: { id: { in: staffIds } } } }]
          : []),
      ],
    });
  });
}

/** Ids of assignments linked to a card on any board matching `boardWhere`. */
async function assignmentIdsOnBoards(
  context: any,
  boardWhere: any
): Promise<string[]> {
  const boardIds = await findIds(context, "ProposalBoard", boardWhere);
  const ids = new Set<string>();
  // Chunked to stay well under database bind-parameter limits.
  for (let i = 0; i < boardIds.length; i += 5000) {
    const chunk = boardIds.slice(i, i + 5000);
    const rows: { id: string }[] = await context.prisma.$queryRaw(Prisma.sql`
      SELECT DISTINCT l."A" AS "id"
      FROM "ProposalSection" s
      JOIN "ProposalCard" c ON c."section" = s."id"
      JOIN "_Assignment_proposalCards" l ON l."B" = c."id"
      WHERE s."board" IN (${Prisma.join(chunk)})
    `);
    rows.forEach((row) => ids.add(String(row.id)));
  }
  return [...ids];
}

/**
 * Profiles that are students or mentors in a class the session user staffs,
 * or null when the user staffs no class (the clause can never match).
 */
async function profileInStaffClassWhere(context: any) {
  const profileIds = await staffClassMemberIds(context);
  if (profileIds.length === 0) return null;
  return { id: { in: profileIds } };
}

/**
 * Ids of profiles that are students or mentors in a class the session user
 * staffs. A plain id list lets Postgres use the author/creator indexes; the
 * equivalent relation filter (author → studentIn/mentorIn → class) made it
 * scan every homework, journal or post row.
 */
function staffClassMemberIds(context: any): Promise<string[]> {
  return cachedIds(context, "staffClassMembers", async () => {
    const classIds = await staffClassIds(context);
    if (classIds.length === 0) return [];
    const staffClass = { some: { id: { in: classIds } } };
    return findIds(context, "Profile", {
      OR: [{ studentIn: staffClass }, { mentorIn: staffClass }],
    });
  });
}

/** Ids of assignments of classes the session user staffs. */
function staffClassAssignmentIds(context: any): Promise<string[]> {
  return cachedIds(context, "staffClassAssignments", async () => {
    const classIds = await staffClassIds(context);
    if (classIds.length === 0) return [];
    return findIds(context, "Assignment", {
      classes: { some: { id: { in: classIds } } },
    });
  });
}

/**
 * Class reads: members, plus people connected through the class's networks
 * (network creators/admins/members, classes in the same network, public
 * networks). Roster emails are protected separately by Profile field rules.
 */
export async function classQueryFilter({ session, context }: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (isAdmin({ session })) return true;
  const [memberIds, networkIds] = await Promise.all([
    memberClassIds(context),
    connectedNetworkIds(context),
  ]);
  return {
    OR: [
      { id: { in: memberIds } },
      ...(networkIds.length
        ? [{ networks: { some: { id: { in: networkIds } } } }]
        : []),
    ],
  };
}

/** Journal reads: the owner and staff of the owner's classes. */
export async function journalQueryFilter({
  session,
  context,
}: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (isAdmin({ session })) return true;
  const me = String(session.itemId);
  const inStaffClass = await profileInStaffClassWhere(context);
  return {
    OR: [
      { creator: { id: { equals: me } } },
      ...(inStaffClass ? [{ creator: inStaffClass }] : []),
    ],
  };
}

/** Journal writes: the owner. */
export function journalOwnerFilter({ session }: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (isAdmin({ session })) return true;
  return { creator: { id: { equals: String(session.itemId) } } };
}

/** Post reads: the author or journal owner, and staff of their classes. */
export async function postQueryFilter({ session, context }: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (isAdmin({ session })) return true;
  const me = String(session.itemId);
  const inStaffClass = await profileInStaffClassWhere(context);
  return {
    OR: [
      { author: { id: { equals: me } } },
      { journal: { creator: { id: { equals: me } } } },
      ...(inStaffClass
        ? [
            { author: inStaffClass },
            { journal: { creator: inStaffClass } },
          ]
        : []),
    ],
  };
}

/** Post writes: the author or the journal owner. */
export function postOwnerFilter({ session }: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (isAdmin({ session })) return true;
  const me = String(session.itemId);
  return {
    OR: [
      { author: { id: { equals: me } } },
      { journal: { creator: { id: { equals: me } } } },
    ],
  };
}

/** Homework clauses for class staff (grading); empty for non-staff. */
async function homeworkStaffWhere(context: any) {
  const [memberIds, assignmentIds] = await Promise.all([
    staffClassMemberIds(context),
    staffClassAssignmentIds(context),
  ]);
  return [
    ...(memberIds.length ? [{ author: { id: { in: memberIds } } }] : []),
    ...(assignmentIds.length
      ? [{ assignment: { id: { in: assignmentIds } } }]
      : []),
  ];
}

/**
 * Ids of homework on a card of a study's main project board (peer reviewers
 * may read these). One indexed join per request: as a relation filter on
 * Homework (proposalCard → section → board → studyMain), Prisma's SQL made
 * Postgres scan every homework row through that chain — and again for its
 * "relation is set" checks — on every homework query.
 */
const PEER_HOMEWORK_LIST_LIMIT = 20000;

function peerReviewHomeworkIds(context: any): Promise<string[]> {
  return cachedIds(context, "peerReviewHomework", async () => {
    const rows: { id: string }[] = await context.prisma.$queryRaw(Prisma.sql`
      SELECT h."id" AS "id"
      FROM "ProposalBoard" b
      JOIN "ProposalSection" s ON s."board" = b."id"
      JOIN "ProposalCard" c ON c."section" = s."id"
      JOIN "Homework" h ON h."proposalCard" = c."id"
      WHERE b."studyMain" IS NOT NULL
    `);
    return rows.map((row) => String(row.id));
  });
}

/**
 * Homework reads: the author, class staff, and (peer review) any signed-in
 * user when the homework sits on a card of a study's main project board.
 */
export async function homeworkQueryFilter({
  session,
  context,
}: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (isAdmin({ session })) return true;
  const me = String(session.itemId);
  const [staffWhere, peerIds] = await Promise.all([
    homeworkStaffWhere(context),
    peerReviewHomeworkIds(context),
  ]);
  // Past the limit an id list risks database parameter limits, so fall back
  // to the (slow but equivalent) relation filter.
  const peerWhere =
    peerIds.length > PEER_HOMEWORK_LIST_LIMIT
      ? [{ proposalCard: { section: { board: { NOT: [{ studyMain: null }] } } } }]
      : peerIds.length
        ? [{ id: { in: peerIds } }]
        : [];
  return {
    OR: [{ author: { id: { equals: me } } }, ...staffWhere, ...peerWhere],
  };
}

/** Homework updates: the author, and class staff (grading). */
export async function homeworkUpdateFilter({
  session,
  context,
}: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (isAdmin({ session })) return true;
  const me = String(session.itemId);
  return {
    OR: [
      { author: { id: { equals: me } } },
      ...(await homeworkStaffWhere(context)),
    ],
  };
}

/**
 * Assignment reads: the author, class staff, students of the class once the
 * assignment is published, platform templates, and assignments linked to
 * cards on boards the user can use (copyProposalBoard reads and connects
 * these as the caller).
 */
export async function assignmentQueryFilter({
  session,
  context,
}: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (isAdmin({ session })) return true;
  const me = String(session.itemId);
  const [staffIds, studentIds, boardAssignments] = await Promise.all([
    staffClassIds(context),
    studentClassIds(context),
    boardAssignmentIds(context),
  ]);
  return {
    OR: [
      { author: { id: { equals: me } } },
      ...(staffIds.length
        ? [{ classes: { some: { id: { in: staffIds } } } }]
        : []),
      ...(studentIds.length
        ? [
            {
              classes: { some: { id: { in: studentIds } } },
              public: { equals: true },
            },
          ]
        : []),
      { isTemplate: { equals: true } },
      ...(boardAssignments.length
        ? [{ id: { in: boardAssignments } }]
        : []),
    ],
  };
}

/**
 * Assignment updates: the author, staff of its classes, and owners of a
 * board it is linked to (template boards re-point linked assignments).
 */
export async function assignmentUpdateFilter({
  session,
  context,
}: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (isAdmin({ session })) return true;
  const me = String(session.itemId);
  const [staffIds, boardAssignments] = await Promise.all([
    staffClassIds(context),
    ownedBoardAssignmentIds(context),
  ]);
  return {
    OR: [
      { author: { id: { equals: me } } },
      ...(staffIds.length
        ? [{ classes: { some: { id: { in: staffIds } } } }]
        : []),
      ...(boardAssignments.length
        ? [{ id: { in: boardAssignments } }]
        : []),
    ],
  };
}

// Per-request memo for async access checks. Field access runs once per item
// and field, so a profile list with several private fields would otherwise
// repeat the same lookup many times in one GraphQL response.
const requestMemo = new WeakMap<object, Map<string, Promise<boolean>>>();

function memoPerRequest(
  context: any,
  key: string,
  compute: () => Promise<boolean>
): Promise<boolean> {
  const scope = context?.req ?? context;
  if (!scope) return compute();
  let memo = requestMemo.get(scope);
  if (!memo) {
    memo = new Map();
    requestMemo.set(scope, memo);
  }
  const cached = memo.get(key);
  if (cached) return cached;
  const result = compute();
  memo.set(key, result);
  return result;
}

/**
 * Private profile data (email, study/consent info, personal work) is visible
 * to the profile owner, admins, and staff of a class the profile belongs to.
 */
export function canViewPrivateProfile(
  context: any,
  profileId: string | null | undefined
): Promise<boolean> {
  const session = context?.session;
  const me = session?.itemId;
  if (!me || !profileId) return Promise.resolve(false);
  if (String(profileId) === String(me)) return Promise.resolve(true);
  if (isAdmin({ session })) return Promise.resolve(true);
  return memoPerRequest(context, `privateProfile:${profileId}`, async () => {
    const classIds = await staffClassIds(context);
    if (classIds.length === 0) return false;
    const inStaffClass = { some: { id: { in: classIds } } };
    const matches = await context.sudo().db.Profile.count({
      where: {
        id: { equals: String(profileId) },
        OR: [
          { studentIn: inStaffClass },
          { mentorIn: inStaffClass },
          { teachingTeamIn: inStaffClass },
        ],
      },
    });
    return matches > 0;
  });
}

/**
 * Participant data (info, generalInfo, studiesInfo: demographics and consent
 * answers) is also visible to the author and collaborators of a study the
 * profile took part in, for Test & Collect.
 */
export function canViewParticipantData(
  context: any,
  profileId: string | null | undefined
): Promise<boolean> {
  const me = context?.session?.itemId;
  if (!me || !profileId) return Promise.resolve(false);
  return memoPerRequest(context, `participantData:${profileId}`, async () => {
    if (await canViewPrivateProfile(context, profileId)) return true;
    const matches = await context.sudo().db.Profile.count({
      where: {
        id: { equals: String(profileId) },
        participantIn: {
          some: {
            OR: [
              { author: { id: { equals: String(me) } } },
              { collaborators: { some: { id: { equals: String(me) } } } },
            ],
          },
        },
      },
    });
    return matches > 0;
  });
}

/**
 * Field access for ConnectPreference.teachingTeamNote: platform admins or
 * teaching-team staff on the preference's round. Students (including the
 * submitter) never read or write this field.
 */
export async function canAccessTeachingTeamNote({
  session,
  context,
  item,
}: {
  session?: Session;
  context: any;
  item?: any;
}): Promise<boolean> {
  if (!isSignedIn({ session })) return false;
  if (permissions.canManageUsers({ session })) return true;
  const roundId = item?.roundId as string | null | undefined;
  if (!roundId || !session?.itemId) return false;
  const rounds = await context.sudo().query.ConnectRound.findMany({
    where: {
      id: { equals: roundId },
      OR: connectRoundStaffRoundClauses(session.itemId),
    },
    query: "id",
    take: 1,
  });
  return rounds.length > 0;
}

/** Opportunity sponsors, assigned mentors, or legacy mentor (Connect stakeholder access). */
function opportunityStakeholderClauses(me: string) {
  return [
    { opportunity: { sponsors: { some: { id: { equals: me } } } } },
    { opportunity: { mentors: { some: { id: { equals: me } } } } },
    { opportunity: { mentor: { id: { equals: me } } } },
  ];
}

// Rule based functions
// rules can return a boolean or a filter that limits which products they can CRUD
export const rules = {
  canEditAdminUI({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return "hidden";
    }
    if (permissions.canAccessAdminUI({ session })) {
      return "edit";
    }
    if (permissions.canManageUsers({ session })) {
      return "edit";
    }
    return "hidden";
  },
  canReadAdminUI({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return "hidden";
    }
    if (permissions.canAccessAdminUI({ session })) {
      return "read";
    }
    if (permissions.canManageUsers({ session })) {
      return "read";
    }
    return "hidden";
  },
  // Issue #8: removed the spoofable operationName bypass.
  // Follow/unfollow operations must go through dedicated custom mutations
  // that update only the relevant relationship fields on their own.
  canManageUsers({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the admin permission
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    // 2. Otherwise, they may only update themselves
    if (item?.id === session?.itemId) {
      return true;
    }
    return false;
  },
  // Issue #9: added explicit `return false` on all non-matching branches.
  // Also replaced non-existent permission function calls (e.g. canManagePosts,
  // canManageCollections) with canManageUsers — the only admin flag that exists
  // in permissionsList and is actually evaluated.
  canManagePosts({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.authorId === session.itemId) {
      return true;
    }
    return false;
  },
  canManageCollections({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.ownerId === session.itemId) {
      return true;
    }
    return false;
  },
  canManageContracts({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (
      item.customerId === session.itemId ||
      item.supplierId === session.itemId
    ) {
      return true;
    }
    return false;
  },
  canManageProposals({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.fromId === session.itemId || item.toId === session.itemId) {
      return true;
    }
    return false;
  },
  canManagePriceBids({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.fromId === session.itemId || item.toId === session.itemId) {
      return true;
    }
    return false;
  },
  canManageTransactions({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.fromId === session.itemId || item.toId === session.itemId) {
      return true;
    }
    return false;
  },
  canManageUserImages({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.userId === session.itemId) {
      return true;
    }
    return false;
  },
  canManageRoles({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canAccessAdminUI({ session })) {
      return true;
    }
    return false;
  },
  canManageTemplates({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.author === session.itemId) {
      return true;
    }
    return false;
  },
  canManageTasks({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.author === session.itemId) {
      return true;
    }
    return false;
  },
  canManageProjects({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.author === session.itemId) {
      return true;
    }
    return false;
  },
  // Log: opportunity preview visits are private to the student, class
  // creator/mentors, and admins. Non-visit logs stay openly readable.
  // Do NOT include opportunity sponsors — sponsors must not see browsing.
  logQuery({ session }: ListAccessArgs) {
    const visitEvent = { equals: "OPPORTUNITY_PREVIEW_VISIT" };
    if (!isSignedIn({ session })) {
      return { NOT: { event: visitEvent } };
    }
    if (permissions.canManageUsers({ session })) return true;
    const me = session!.itemId;
    return {
      OR: [
        { NOT: { event: visitEvent } },
        { user: { id: { equals: me } } },
        { class: { creator: { id: { equals: me } } } },
        { class: { teachingTeam: { some: { id: { equals: me } } } } },
        { class: { mentors: { some: { id: { equals: me } } } } },
      ],
    };
  },
  // Visit rows: admin-only update/delete. Other log events keep open mutate.
  logVisitMutate({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    return { NOT: { event: { equals: "OPPORTUNITY_PREVIEW_VISIT" } } };
  },
  // Connect: a profile's own preference / answers / team prefs are visible to:
  // - themselves
  // - the creator of the round (teacher)
  // - admins
  // Returns a filter, NOT a boolean — used as `access.filter.query`.
  connectOwnerOrRoundCreator({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session.itemId;
    return {
      OR: [
        { submitter: { id: { equals: me } } },
        ...connectRoundStaffRoundClauses(me).map((clause) => ({
          round: clause,
        })),
      ],
    };
  },
  // QuestionAnswer uses `respondent`, not `submitter`.
  connectAnswerVisible({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session.itemId;
    return {
      OR: [
        { respondent: { id: { equals: me } } },
        ...connectRoundStaffRoundClauses(me).map((clause) => ({
          round: clause,
        })),
      ],
    };
  },
  // ConnectMatch visible to: any matched student, opportunity sponsors/mentors,
  // the round creator, class-network creators/admins, or platform admins.
  connectMatchVisible({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session.itemId;
    return {
      OR: [
        { students: { some: { id: { equals: me } } } },
        ...opportunityStakeholderClauses(me),
        ...connectRoundStaffRoundClauses(me).map((clause) => ({
          round: clause,
        })),
        { classNetwork: { creator: { id: { equals: me } } } },
        { classNetwork: { admins: { some: { id: { equals: me } } } } },
        {
          classNetwork: {
            classes: { some: { creator: { id: { equals: me } } } },
          },
        },
        {
          classNetwork: {
            classes: { some: { teachingTeam: { some: { id: { equals: me } } } } },
          },
        },
        {
          classNetwork: {
            classes: { some: { mentors: { some: { id: { equals: me } } } } },
          },
        },
      ],
    };
  },
  // ConnectRating: rater, opportunity sponsors/mentors, round creator (via match.round),
  // or a public rating — visible to anyone signed in.
  connectRatingVisible({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session.itemId;
    return {
      OR: [
        { rater: { id: { equals: me } } },
        { isPublic: { equals: true } },
        ...opportunityStakeholderClauses(me),
        { match: { round: { createdBy: { id: { equals: me } } } } },
      ],
    };
  },
  // Organization: only members (and admins) can update or delete.
  // Read access stays open — anyone can browse organizations.
  connectOrganizationMutate({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session!.itemId;
    return {
      OR: [
        { admins: { some: { id: { equals: me } } } },
        { createdBy: { id: { equals: me } } },
        { members: { some: { id: { equals: me } } } },
      ],
    };
  },
  // ClassNetwork: creators and explicitly assigned network admins manage
  // network metadata/membership. Admin UI operators keep full override.
  classNetworkMutate({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (canAdminManageNetworks({ session })) return true;
    const me = session.itemId;
    return {
      OR: [
        { creator: { id: { equals: me } } },
        { admins: { some: { id: { equals: me } } } },
      ],
    };
  },
  // NetworkInvite: visible to the target profile, the initiator, network
  // creator/admins, and Admin UI operators.
  networkInviteVisible({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (canAdminManageNetworks({ session })) return true;
    const me = session.itemId;
    return {
      OR: [
        { profile: { id: { equals: me } } },
        { requestedBy: { id: { equals: me } } },
        { classNetwork: { creator: { id: { equals: me } } } },
        { classNetwork: { admins: { some: { id: { equals: me } } } } },
      ],
    };
  },
  // ConnectPreferenceItem inherits from its parent preference's submitter / round creator.
  connectPreferenceItemVisible({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session.itemId;
    return {
      OR: [
        { preference: { submitter: { id: { equals: me } } } },
        ...connectRoundStaffRoundClauses(me).map((clause) => ({
          preference: { round: clause },
        })),
      ],
    };
  },
  // OpportunityReviewNote query: visible to the author, any reviewer on
  // the same round, the round creator, class-network admins/class teachers,
  // opportunity sponsors/mentors, or admins.
  connectReviewNoteVisible({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session.itemId;
    return {
      OR: [
        { author: { id: { equals: me } } },
        { round: { createdBy: { id: { equals: me } } } },
        { round: { reviewers: { some: { id: { equals: me } } } } },
        { round: { classNetwork: { creator: { id: { equals: me } } } } },
        { round: { classNetwork: { admins: { some: { id: { equals: me } } } } } },
        {
          round: {
            classNetwork: {
              classes: { some: { creator: { id: { equals: me } } } },
            },
          },
        },
        {
          round: {
            classNetwork: {
              classes: {
                some: { teachingTeam: { some: { id: { equals: me } } } },
              },
            },
          },
        },
        {
          round: {
            classNetwork: {
              classes: { some: { mentors: { some: { id: { equals: me } } } } },
            },
          },
        },
        ...opportunityStakeholderClauses(me),
      ],
    };
  },
  // OpportunityReviewNote mutate: only the author or an admin can edit
  // or delete a note. Reviewers can leave their own notes (the create
  // operation is gated separately via the round-reviewer check at the
  // application layer; here we just stop users from editing other
  // reviewers' notes).
  connectReviewNoteMutate({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session.itemId;
    return {
      author: { id: { equals: me } },
    };
  },
  // Connect customizable forms — FormDefinition mutate.
  // Admins (canManageUsers) can manage any definition. Users with
  // canManageForms can manage scope=organization definitions for orgs
  // they are members of. Class creators, Class.mentors, and board
  // creator/author/collaborators can manage scope=project_board
  // definitions on class template boards and scope=class definitions
  // for their class (teacher form wizard).
  formDefinitionMutate({ session }: ListAccessArgs) {
    return formDefinitionMutateFilter(session);
  },
  // FormCard mutate inherits the same rule via the parent definition.
  formCardMutate({ session }: ListAccessArgs) {
    const filter = formDefinitionMutateFilter(session);
    if (filter === true || filter === false) return filter;
    return {
      OR: filter.OR.map((clause: Record<string, unknown>) => ({
        definition: clause,
      })),
    };
  },
  // FormField mutate inherits via card.definition.
  formFieldMutate({ session }: ListAccessArgs) {
    const filter = formDefinitionMutateFilter(session);
    if (filter === true || filter === false) return filter;
    return {
      OR: filter.OR.map((clause: Record<string, unknown>) => ({
        card: { definition: clause },
      })),
    };
  },
  async formCardCreate({ session, context, inputData }: ListAccessArgs) {
    return canCreateFormCard({ session, context, inputData });
  },
  async formFieldCreate({ session, context, inputData }: ListAccessArgs) {
    return canCreateFormField({ session, context, inputData });
  },
  // Template-scoped milestones: admins, canManageForms, or class staff /
  // board collaborators on a non-platform class template board.
  milestoneMutate({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    if (permissions.canManageForms({ session })) return true;
    const me = session.itemId;
    return {
      scope: { equals: "template" },
      templateBoard: classTemplateBoardFilter(me),
    };
  },
  async milestoneCreate({ session, context, inputData }: ListAccessArgs) {
    return canCreateTemplateMilestone({ session, context, inputData });
  },
  async formDefinitionCreate({ session, context, inputData }: ListAccessArgs) {
    return canCreateScopedFormDefinition({ session, context, inputData });
  },
  // For mutate operations on the above lists: only the owner or admin.
  // The relevant owner-field name is passed via closure.
  connectOwnerMutate(ownerField: string) {
    return function ({ session, item }: ListAccessArgs) {
      if (!isSignedIn({ session })) return false;
      if (permissions.canManageUsers({ session })) return true;
      // item access fires per item; ownerField is e.g. "submitterId" / "respondentId" / "raterId" / "studentId"
      if (item && item[ownerField] === session.itemId) return true;
      return false;
    };
  },
};

export const CLASS_TEMPLATE_BOARD_ACCESS_QUERY = `
  id
  isTemplate
  creator { id }
  author { id }
  collaborators { id }
  templateForClasses { id creator { id } teachingTeam { id } mentors { id } }
  templatesForClass { id creator { id } teachingTeam { id } mentors { id } }
`;

const FORM_DEFINITION_ACCESS_QUERY = `
  id
  scope
  organization { members { id } }
  class { creator { id } teachingTeam { id } mentors { id } }
  proposalBoard {
    ${CLASS_TEMPLATE_BOARD_ACCESS_QUERY}
  }
`;

type ClassLink = {
  id?: string | null;
  creator?: { id?: string | null } | null;
  teachingTeam?: { id?: string | null }[] | null;
  mentors?: { id?: string | null }[] | null;
};

export type ClassTemplateBoardAccessShape = {
  id?: string | null;
  isTemplate?: boolean | null;
  creator?: { id?: string | null } | null;
  author?: { id?: string | null } | null;
  collaborators?: { id?: string | null }[] | null;
  templateForClasses?: ClassLink[] | null;
  templatesForClass?: ClassLink[] | null;
};

function getLinkedClasses(
  board: ClassTemplateBoardAccessShape | null | undefined
) {
  return [
    ...(board?.templateForClasses || []),
    ...(board?.templatesForClass || []),
  ];
}

/** True when the board is used as a class template (not a platform library board). */
export function isClassTemplateBoardAccess(
  board: ClassTemplateBoardAccessShape | null | undefined
) {
  if (!board || board.isTemplate) return false;
  return getLinkedClasses(board).length > 0;
}

/**
 * Class creator, Class.mentors, or board creator/author/collaborator may mutate
 * class-template milestones and project_board review forms. Platform isTemplate
 * boards are never allowed here.
 */
export function canMutateClassTemplateBoard(
  userId: string | null | undefined,
  board: ClassTemplateBoardAccessShape | null | undefined
) {
  if (!userId || !isClassTemplateBoardAccess(board)) return false;
  if (board!.creator?.id === userId) return true;
  if (board!.author?.id === userId) return true;
  if ((board!.collaborators || []).some((c) => c?.id === userId)) return true;
  return getLinkedClasses(board).some(
    (klass) =>
      klass?.creator?.id === userId ||
      (klass?.teachingTeam || []).some((m) => m?.id === userId) ||
      (klass?.mentors || []).some((m) => m?.id === userId)
  );
}

/**
 * Prisma/Keystone filter for ProposalBoard rows the user may treat as
 * class templates: not isTemplate, and either class creator/mentor or
 * board creator/author/collaborator.
 */
function classTemplateBoardFilter(me: string) {
  const classStaffSomeFilter = classStaffSome(me);
  return {
    AND: [
      { isTemplate: { equals: false } },
      {
        OR: [
          { creator: { id: { equals: me } } },
          { author: { id: { equals: me } } },
          { collaborators: { some: { id: { equals: me } } } },
          { templateForClasses: { some: classStaffSomeFilter } },
          { templatesForClass: { some: classStaffSomeFilter } },
        ],
      },
      {
        OR: [
          { templateForClasses: { some: {} } },
          { templatesForClass: { some: {} } },
        ],
      },
    ],
  };
}

function projectBoardFormScopeFilter(me: string) {
  return {
    scope: { equals: "project_board" },
    proposalBoard: classTemplateBoardFilter(me),
  };
}

function classFormScopeFilter(me: string) {
  return {
    scope: { equals: "class" },
    class: classStaffSome(me),
  };
}

function organizationFormScopeFilter(me: string) {
  return {
    scope: { equals: "organization" },
    organization: { members: { some: { id: { equals: me } } } },
  };
}

function formDefinitionMutateFilter(session?: ListAccessArgs["session"]) {
  if (!isSignedIn({ session })) return false;
  if (permissions.canManageUsers({ session })) return true;
  const me = session!.itemId;
  const orFilters: Record<string, unknown>[] = [
    projectBoardFormScopeFilter(me),
    classFormScopeFilter(me),
  ];
  if (permissions.canManageForms({ session })) {
    orFilters.unshift(organizationFormScopeFilter(me));
  }
  return { OR: orFilters };
}

export function canMutateFormDefinition(
  session: ListAccessArgs["session"],
  definition: {
    scope?: string | null;
    organization?: { members?: { id?: string | null }[] | null } | null;
    class?: {
      creator?: { id?: string | null } | null;
      mentors?: { id?: string | null }[] | null;
    } | null;
    proposalBoard?: ClassTemplateBoardAccessShape | null;
  } | null
) {
  if (!session?.itemId || !definition) return false;
  if (permissions.canManageUsers({ session })) return true;
  const me = session.itemId;
  if (
    definition.scope === "organization" &&
    permissions.canManageForms({ session })
  ) {
    return (definition.organization?.members || []).some(
      (member) => member?.id === me
    );
  }
  if (definition.scope === "class") {
    if (definition.class?.creator?.id === me) return true;
    return (definition.class?.mentors || []).some(
      (mentor) => mentor?.id === me
    );
  }
  if (definition.scope === "project_board") {
    return canMutateClassTemplateBoard(me, definition.proposalBoard);
  }
  return false;
}

async function loadClassTemplateBoard(
  context: any,
  boardId: string | null | undefined
) {
  if (!boardId || !context) return null;
  return context.query.ProposalBoard.findOne({
    where: { id: boardId },
    query: CLASS_TEMPLATE_BOARD_ACCESS_QUERY,
  });
}

async function canCreateTemplateMilestone({
  session,
  context,
  inputData,
}: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (permissions.canManageUsers({ session })) return true;
  if (permissions.canManageForms({ session })) return true;

  const scope = inputData?.scope ?? "global";
  if (scope !== "template") return false;

  const boardId = inputData?.templateBoard?.connect?.id;
  const board = await loadClassTemplateBoard(context, boardId);
  return canMutateClassTemplateBoard(session.itemId, board);
}

async function canCreateScopedFormDefinition({
  session,
  context,
  inputData,
}: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (permissions.canManageUsers({ session })) return true;

  const scope = inputData?.scope ?? "global";
  if (scope === "global") return false;

  if (scope === "organization") {
    if (!permissions.canManageForms({ session })) return false;
    const orgId = inputData?.organization?.connect?.id;
    if (!orgId || !context) return false;
    const org = await context.query.Organization.findOne({
      where: { id: orgId },
      query: "id members { id }",
    });
    return (org?.members || []).some(
      (member: { id?: string }) => member?.id === session.itemId
    );
  }

  if (scope === "class") {
    const classId = inputData?.class?.connect?.id;
    if (!classId || !context) return false;
    const klass = await context.query.Class.findOne({
      where: { id: classId },
      query: "id creator { id } teachingTeam { id } mentors { id }",
    });
    if (!klass) return false;
    if (klass.creator?.id === session.itemId) return true;
    if (
      (klass.teachingTeam || []).some(
        (m: { id?: string }) => m?.id === session.itemId
      )
    ) {
      return true;
    }
    return (klass.mentors || []).some(
      (m: { id?: string }) => m?.id === session.itemId
    );
  }

  if (scope === "project_board") {
    const boardId = inputData?.proposalBoard?.connect?.id;
    const board = await loadClassTemplateBoard(context, boardId);
    return canMutateClassTemplateBoard(session.itemId, board);
  }

  return false;
}

async function canCreateFormCard({
  session,
  context,
  inputData,
}: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (permissions.canManageUsers({ session })) return true;
  const definitionId = inputData?.definition?.connect?.id;
  if (!definitionId || !context) {
    return !!permissions.canManageForms({ session });
  }
  const definition = await context.query.FormDefinition.findOne({
    where: { id: definitionId },
    query: FORM_DEFINITION_ACCESS_QUERY,
  });
  return canMutateFormDefinition(session, definition);
}

async function canCreateFormField({
  session,
  context,
  inputData,
}: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (permissions.canManageUsers({ session })) return true;
  const cardId = inputData?.card?.connect?.id;
  if (!cardId || !context) {
    return !!permissions.canManageForms({ session });
  }
  const card = await context.query.FormCard.findOne({
    where: { id: cardId },
    query: `definition { ${FORM_DEFINITION_ACCESS_QUERY} }`,
  });
  return canMutateFormDefinition(session, card?.definition);
}
