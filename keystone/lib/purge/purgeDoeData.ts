// Fully deletes the DOE data in a scope (lib/doe/findDoeData.ts): one person
// at DOE's direction, one school that stops using MindHive, or everything at
// termination. Never runs on a schedule.
//
// What stays, outside termination:
//   - boards and studies shared with someone outside the scope, with the
//     people in scope removed from them;
//   - other content with a member outside the scope, likewise;
//   - teaching materials (templates, tasks, lessons, resources, curricula,
//     assignments), kept for the classes using them, author removed;
//   - what a shared study collected from people outside the scope, guests
//     included (their data is not in findDoeData's result at all).
// At termination (`termination: true`, scope { all: true }) all of it goes,
// shared or not, with the content kept from de-identified accounts.
//
// Raw study files are deleted before their database rows, so a run that
// stops early leaves rows to find again rather than files nobody points to.
// Afterwards every record selected for deletion is looked up again by id, since
// searching the scope alone finds nothing once its accounts and classes are
// gone, and the scope is searched too; `remaining` should be all zeros.
// dryRun only counts.

import { countDoeData, findDoeData, inChunks, DoeScope } from "../doe/findDoeData";
import { deleteOwnedRecords } from "./deidentify";
import { deleteRecords } from "./deleteRecords";
import {
  CONTENT_RELATIONS,
  TEACHING_MATERIAL_LISTS,
  accessor,
  relationByField,
} from "./profileRelations";
import { deleteRawFolders } from "./rawFiles";

export type PurgeCounts = {
  rawFolders: number;
  deleted: Record<string, number>;
  kept: Record<string, number>;
  remaining?: Record<string, number>;
};

const add = (bag: Record<string, number>, key: string, n: number) => {
  if (n) bag[key] = (bag[key] || 0) + n;
};

/** Content (other than boards and studies) the people in scope worked on. */
async function contentOfPeople(prisma: any, profileIds: string[]) {
  const byList = new Map<string, Set<string>>();
  if (!profileIds.length) return byList;
  for (const field of CONTENT_RELATIONS) {
    const { model, backField, backIsList } = relationByField(field);
    if (model === "ProposalBoard" || model === "Study" || !backField) continue;
    const match = { id: { in: profileIds } };
    const rows = await prisma[accessor(model)].findMany({
      where: { [backField]: backIsList ? { some: match } : match },
      select: { id: true },
    });
    const ids = byList.get(model) || new Set<string>();
    rows.forEach((r: any) => ids.add(r.id));
    byList.set(model, ids);
  }
  return byList;
}

/** The profiles linked to each record, through all content relations. */
async function membersOf(prisma: any, model: string, ids: string[]) {
  const backFields = CONTENT_RELATIONS.map(relationByField)
    .filter((r) => r.model === model && r.backField)
    .map((r) => r.backField as string);
  const rows = await prisma[accessor(model)].findMany({
    where: { id: { in: ids } },
    select: Object.fromEntries([
      ["id", true],
      ...backFields.map((f) => [f, { select: { id: true } }]),
    ]),
  });
  const members = new Map<string, string[]>();
  for (const row of rows) {
    members.set(
      row.id,
      backFields.flatMap((f) => {
        const value = row[f];
        if (!value) return [];
        return Array.isArray(value) ? value.map((v: any) => v.id) : [value.id];
      })
    );
  }
  return members;
}

export async function purgeDoeData(
  context: any,
  scope: DoeScope,
  { dryRun = true, termination = false }: { dryRun?: boolean; termination?: boolean } = {}
): Promise<PurgeCounts> {
  if (termination && !("all" in scope)) {
    throw new Error("Termination deletes all DOE data: use the all-DOE scope.");
  }
  const prisma = context.prisma;
  const data = await findDoeData(prisma, scope);
  const inScope = new Set(data.profileIds);
  const counts: PurgeCounts = { rawFolders: 0, deleted: {}, kept: {} };

  const selected = new Map<string, Set<string>>();
  const remove = (listKey: string, ids: string[]) => {
    const seen = selected.get(listKey) || new Set<string>();
    ids.forEach((id) => seen.add(id));
    selected.set(listKey, seen);
    return deleteRecords(context, listKey, ids, dryRun);
  };

  // 1. Study data: raw files first, then rows.
  counts.rawFolders = await deleteRawFolders(data.datasets, dryRun);
  const studyData: [string, string, string[]][] = [
    ["Dataset", "dataset", data.datasets.map((d) => d.id)],
    ["SummaryResult", "summaryResult", data.summaryResultIds],
    ["StudyDataSourceRecord", "studyDataSourceRecord", data.dataSourceRecordIds],
  ];
  for (const [listKey, , ids] of studyData) {
    add(counts.deleted, listKey, await remove(listKey, ids));
  }
  add(counts.kept, "Dataset (other people, shared study)", data.keptStudyData.datasets);
  add(counts.kept, "SummaryResult (other people, shared study)", data.keptStudyData.summaryResults);
  add(counts.kept, "StudyDataSourceRecord (other people, shared study)", data.keptStudyData.dataSourceRecords);

  // Guests go only when none of their study data stays.
  const guestsStaying = new Set<string>();
  for (const [, model, ids] of studyData) {
    const going = new Set(ids);
    const rows = await inChunks(data.guestIds, (part) =>
      prisma[model].findMany({
        where: { guestId: { in: part } },
        select: { id: true, guestId: true },
      })
    );
    rows.forEach((r: any) => {
      if (!going.has(r.id)) guestsStaying.add(r.guestId);
    });
  }
  add(counts.deleted, "Guest", await remove("Guest", data.guestIds.filter((id) => !guestsStaying.has(id))));
  add(counts.kept, "Guest (has data that stays)", guestsStaying.size);

  // 2. Boards and studies: only their own, unless terminating.
  const boards = termination ? [...data.boards.scoped, ...data.boards.shared] : data.boards.scoped;
  const studies = termination ? [...data.studies.scoped, ...data.studies.shared] : data.studies.scoped;
  add(counts.deleted, "ProposalBoard", await remove("ProposalBoard", boards));
  add(counts.deleted, "Study", await remove("Study", studies));
  if (!termination) {
    add(counts.kept, "ProposalBoard (shared)", data.boards.shared.length);
    add(counts.kept, "Study (shared)", data.studies.shared.length);
  }

  // 3. Other content: deleted when nobody outside the scope is on it.
  const content = await contentOfPeople(prisma, data.profileIds);
  for (const [listKey, idSet] of content) {
    const ids = [...idSet];
    if (!ids.length) continue;
    let toDelete = ids;
    if (!termination) {
      if (TEACHING_MATERIAL_LISTS.has(listKey)) {
        add(counts.kept, `${listKey} (teaching material)`, ids.length);
        continue;
      }
      const members = await membersOf(prisma, listKey, ids);
      toDelete = ids.filter((id) => (members.get(id) || []).every((m) => inScope.has(m)));
      add(counts.kept, `${listKey} (shared)`, ids.length - toDelete.length);
    }
    add(counts.deleted, listKey, await remove(listKey, toDelete));
  }

  // 4. Content kept from de-identified accounts (all-DOE scope only).
  if (termination && data.retained.length) {
    const byList = new Map<string, string[]>();
    for (const { listKey, itemId } of data.retained) {
      byList.set(listKey, [...(byList.get(listKey) || []), itemId]);
    }
    for (const [listKey, ids] of byList) {
      add(counts.deleted, `${listKey} (retained)`, await remove(listKey, ids));
    }
    if (!dryRun) await prisma.doeRetainedRecord.deleteMany({});
    add(counts.deleted, "DoeRetainedRecord", data.retained.length);
  }

  // 5. The people: their personal records and files, then the accounts.
  let ownedLeft = 0;
  for (const profileId of data.profileIds) {
    const owned = await deleteOwnedRecords(context, profileId, dryRun);
    for (const [field, n] of Object.entries(owned.deleted)) add(counts.deleted, field, n);
    add(counts.deleted, "files", owned.files);
    if (dryRun) continue;
    const left = await deleteOwnedRecords(context, profileId, true);
    ownedLeft += left.files + Object.values(left.deleted).reduce((a, n) => a + n, 0);
  }
  add(counts.deleted, "Profile", await remove("Profile", data.profileIds));

  // 6. The classes (school and all-DOE scopes).
  add(counts.deleted, "Class", await remove("Class", data.classIds));

  if (!dryRun) {
    const remaining: Record<string, number> = {
      "raw study folders": await deleteRawFolders(data.datasets, true),
      "personal records of deleted accounts": ownedLeft,
    };
    for (const [listKey, ids] of selected) {
      remaining[listKey] = await deleteRecords(context, listKey, [...ids], true);
    }
    const found = countDoeData(await findDoeData(prisma, scope));
    remaining["found by searching the scope again"] = Object.values(found).reduce((a, n) => a + n, 0);
    counts.remaining = remaining;
  }
  return counts;
}
