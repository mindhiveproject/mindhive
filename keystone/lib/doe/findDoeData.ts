// Finds all DOE data in a scope: every DOE class, one school, or one person.
// The de-identification job, DOE-directed deletion, per-school deletion and
// termination all start here, so "what counts as DOE data" lives in one place.
//
// DOE data is everything connected to a class marked Class.dataOwner =
// NYC_DOE: the accounts of its students, teacher and teaching team (MindHive
// mentors are NYU staff and are left out), the boards and studies of those
// accounts or of those classes, and study data (see below), guests included. A
// student in both a DOE and a non-DOE class counts as DOE.
//
// Boards and studies come back split into those whose members (author,
// creator, collaborators) are all in scope and those shared with someone
// outside it: shared ones stay in place for the other members, only the people
// in scope are removed from them (de-identification, a school leaving). At
// termination everything is deleted, shared or not; that is the caller's call.
//
// Study data follows the same line. It is in scope when it came from a person
// in scope or from a study that goes (one with no member outside the scope).
// A shared study stays, and so does what it collected from everyone else,
// guests included; those rows are only counted (keptStudyData). In the all-DOE
// scope nothing stays: the data of shared studies is in scope too.
//
// De-identified accounts (deidentifiedAt set; only DOE accounts are
// de-identified) and the content kept from them (DoeRetainedRecord) no longer
// belong to any class or school, by design, so only the all-DOE scope, used at
// termination, includes them.
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
  /** Other people's data in the shared studies, which stays. */
  keptStudyData: {
    datasets: number;
    summaryResults: number;
    dataSourceRecords: number;
  };
  /** Content kept from de-identified accounts; all-DOE scope only. */
  retained: { listKey: string; itemId: string }[];
};

/** Postgres caps bind parameters, so long `in` lists are queried in parts. */
const CHUNK = 5000;

export async function inChunks<T>(
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
    const exists = await prisma.profile.count({
      where: { id: String(scope.profileId) },
    });
    profileIds = exists ? [String(scope.profileId)] : [];
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
    if ("all" in scope) {
      const deidentified = await prisma.profile.findMany({
        where: { deidentifiedAt: { not: null } },
        select: { id: true },
      });
      profileIds = unique([...profileIds, ...deidentified.map((p: any) => p.id)]);
    }
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
  const studySplit = split(
    studies.map((s: any) => ({
      id: s.id,
      members: [s.authorId, ...s.collaborators.map((c: any) => c.id)],
    })),
    inScope
  );
  const studiesGoing = new Set("all" in scope ? studyIds : studySplit.scoped);

  // 4. Study data: from those people, or collected by a study that goes.
  const studyData = async (
    model: string,
    personKey: string,
    fields: Record<string, boolean>
  ) => {
    const select = { id: true, studyId: true, guestId: true, [personKey]: true, ...fields };
    const rows: any[] = [
      ...(await inChunks(profileIds, (part) =>
        prisma[model].findMany({ where: { [personKey]: { in: part } }, select })
      )),
      ...(await inChunks(studyIds, (part) =>
        prisma[model].findMany({ where: { studyId: { in: part } }, select })
      )),
    ];
    const found = [...new Map(rows.map((r) => [r.id, r])).values()];
    const inData = found.filter(
      (r) => inScope.has(r[personKey]) || studiesGoing.has(r.studyId)
    );
    return { rows: inData, kept: found.length - inData.length };
  };
  const datasets = await studyData("dataset", "profileId", { token: true, date: true });
  const summaryResults = await studyData("summaryResult", "userId", {});
  const dataSourceRecords = await studyData("studyDataSourceRecord", "profileId", {});

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
    studies: studySplit,
    datasets: datasets.rows as DoeData["datasets"],
    summaryResultIds: summaryResults.rows.map((r) => r.id),
    dataSourceRecordIds: dataSourceRecords.rows.map((r) => r.id),
    guestIds: unique(
      [...datasets.rows, ...summaryResults.rows, ...dataSourceRecords.rows].map(
        (r) => r.guestId
      )
    ),
    keptStudyData: {
      datasets: datasets.kept,
      summaryResults: summaryResults.kept,
      dataSourceRecords: dataSourceRecords.kept,
    },
    retained:
      "all" in scope
        ? await prisma.doeRetainedRecord.findMany({
            select: { listKey: true, itemId: true },
          })
        : [],
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
    retainedRecords: data.retained.length,
  };
}
