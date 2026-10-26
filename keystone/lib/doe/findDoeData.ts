// Finds all DOE data in a scope: every DOE class, one school, or one person.
// The de-identification job, DOE-directed deletion, per-school deletion and
// termination all start here, so "what counts as DOE data" lives in one place.
//
// DOE data is everything connected to a class marked Class.dataOwner =
// NYC_DOE: the accounts of its students, teacher and teaching team (MindHive
// mentors are NYU staff and are left out), the boards and studies of those
// accounts or of those classes, and the study data collected by those studies
// or from those accounts, guests included. A student in both a DOE and a
// non-DOE class counts as DOE.
//
// Boards and studies come back split into those whose members (author,
// creator, collaborators) are all in scope and those shared with someone
// outside it: shared ones stay in place for the other members, only the people
// in scope are removed from them (de-identification, a school leaving). At
// termination everything is deleted, shared or not; that is the caller's call.
//
// Queries are flat (`id: { in: [...] }`, `some` on a join table), never chains
// of nested to-one relation filters, which make Postgres scan whole tables.
// Works on context.prisma or a plain PrismaClient (scripts).

import { DOE_DATA_OWNER } from "./doe";

export type DoeScope =
  | { all: true }
  | { school: string }
  | { profileId: string };

export type DoeRecordSplit = { scoped: string[]; shared: string[] };

export type DoeData = {
  classIds: string[];
  profileIds: string[];
  boards: DoeRecordSplit;
  studies: DoeRecordSplit;
  datasets: {
    id: string;
    token: string | null;
    date: string | null;
    studyId: string | null;
    profileId: string | null;
    guestId: string | null;
  }[];
  summaryResultIds: string[];
  dataSourceRecordIds: string[];
  guestIds: string[];
};

/** Postgres caps bind parameters, so long `in` lists are queried in parts. */
const CHUNK = 5000;

async function inChunks<T>(
  ids: string[],
  query: (part: string[]) => Promise<T[]>
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    out.push(...(await query(ids.slice(i, i + CHUNK))));
  }
  return out;
}

const unique = (values: (string | null | undefined)[]) =>
  [...new Set(values.filter((v): v is string => !!v))];

function split(
  records: { id: string; members: (string | null)[] }[],
  inScope: Set<string>
): DoeRecordSplit {
  const result: DoeRecordSplit = { scoped: [], shared: [] };
  for (const { id, members } of records) {
    const others = members.filter((m) => m && !inScope.has(m));
    (others.length ? result.shared : result.scoped).push(id);
  }
  return result;
}

export async function findDoeData(
  prisma: any,
  scope: DoeScope
): Promise<DoeData> {
  // 1. Classes and the people in them.
  let classIds: string[] = [];
  let profileIds: string[];
  if ("profileId" in scope) {
    profileIds = [String(scope.profileId)];
  } else {
    const classes = await prisma.class.findMany({
      where: {
        dataOwner: DOE_DATA_OWNER,
        ...("school" in scope ? { school: scope.school } : {}),
      },
      select: { id: true },
    });
    classIds = classes.map((c: any) => c.id);
    const people = await inChunks(classIds, (part) => {
      const inClasses = { some: { id: { in: part } } };
      return prisma.profile.findMany({
        where: {
          OR: [
            { studentIn: inClasses },
            { teacherIn: inClasses },
            { teachingTeamIn: inClasses },
          ],
        },
        select: { id: true },
      });
    });
    profileIds = unique(people.map((p: any) => p.id));
  }
  const inScope = new Set(profileIds);

  // 2. Boards: used in those classes, or made by those people. Class
  // templates (templatesForClass) are teaching material, not student work.
  const boardSelect = {
    id: true,
    authorId: true,
    creatorId: true,
    studyId: true,
    studyMainId: true,
    collaborators: { select: { id: true } },
  };
  const boardRows = [
    ...(await inChunks(classIds, (part) =>
      prisma.proposalBoard.findMany({
        where: { usedInClassId: { in: part } },
        select: boardSelect,
      })
    )),
    ...(await inChunks(profileIds, (part) =>
      prisma.proposalBoard.findMany({
        where: {
          OR: [
            { authorId: { in: part } },
            { creatorId: { in: part } },
            { collaborators: { some: { id: { in: part } } } },
          ],
        },
        select: boardSelect,
      })
    )),
  ];
  const boardsById = new Map(boardRows.map((b: any) => [b.id, b]));
  const boards = [...boardsById.values()];

  // 3. Studies: linked to those classes or boards, or made by those people.
  const studySelect = {
    id: true,
    authorId: true,
    collaborators: { select: { id: true } },
  };
  const boardStudyIds = unique(
    boards.flatMap((b: any) => [b.studyId, b.studyMainId])
  );
  const studyRows = [
    ...(await inChunks(classIds, (part) =>
      prisma.study.findMany({
        where: { classes: { some: { id: { in: part } } } },
        select: studySelect,
      })
    )),
    ...(await inChunks(boardStudyIds, (part) =>
      prisma.study.findMany({
        where: { id: { in: part } },
        select: studySelect,
      })
    )),
    ...(await inChunks(profileIds, (part) =>
      prisma.study.findMany({
        where: {
          OR: [
            { authorId: { in: part } },
            { collaborators: { some: { id: { in: part } } } },
          ],
        },
        select: studySelect,
      })
    )),
  ];
  const studiesById = new Map(studyRows.map((s: any) => [s.id, s]));
  const studies = [...studiesById.values()];
  const studyIds = studies.map((s: any) => s.id);

  // 4. Study data: from those people, or collected by those studies.
  const datasetSelect = {
    id: true,
    token: true,
    date: true,
    studyId: true,
    profileId: true,
    guestId: true,
  };
  const datasetRows = [
    ...(await inChunks(profileIds, (part) =>
      prisma.dataset.findMany({
        where: { profileId: { in: part } },
        select: datasetSelect,
      })
    )),
    ...(await inChunks(studyIds, (part) =>
      prisma.dataset.findMany({
        where: { studyId: { in: part } },
        select: datasetSelect,
      })
    )),
  ];
  const datasets = [
    ...new Map(datasetRows.map((d: any) => [d.id, d])).values(),
  ] as DoeData["datasets"];

  const byPersonOrStudy = async (
    model: string,
    personKey: string
  ): Promise<string[]> => {
    const rows = [
      ...(await inChunks(profileIds, (part) =>
        prisma[model].findMany({
          where: { [personKey]: { in: part } },
          select: { id: true },
        })
      )),
      ...(await inChunks(studyIds, (part) =>
        prisma[model].findMany({
          where: { studyId: { in: part } },
          select: { id: true },
        })
      )),
    ];
    return unique(rows.map((r: any) => r.id));
  };

  return {
    classIds,
    profileIds,
    boards: split(
      boards.map((b: any) => ({
        id: b.id,
        members: [
          b.authorId,
          b.creatorId,
          ...b.collaborators.map((c: any) => c.id),
        ],
      })),
      inScope
    ),
    studies: split(
      studies.map((s: any) => ({
        id: s.id,
        members: [s.authorId, ...s.collaborators.map((c: any) => c.id)],
      })),
      inScope
    ),
    datasets,
    summaryResultIds: await byPersonOrStudy("summaryResult", "userId"),
    dataSourceRecordIds: await byPersonOrStudy(
      "studyDataSourceRecord",
      "profileId"
    ),
    guestIds: unique(datasets.map((d) => d.guestId)),
  };
}

/** Counts only: safe to show an admin or log. No names, emails or ids. */
export function countDoeData(data: DoeData) {
  return {
    classes: data.classIds.length,
    people: data.profileIds.length,
    boards: data.boards.scoped.length,
    sharedBoards: data.boards.shared.length,
    studies: data.studies.scoped.length,
    sharedStudies: data.studies.shared.length,
    datasets: data.datasets.length,
    summaryResults: data.summaryResultIds.length,
    dataSourceRecords: data.dataSourceRecordIds.length,
    guests: data.guestIds.length,
  };
}
