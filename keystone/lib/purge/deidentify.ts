// De-identifies one DOE account after two years without a sign-in (DOE data
// agreement; docs: "MindHive: De-identification and Retention of DOE Data").
//
// The account row stays as an anonymous shell so the study data it took part
// in keeps working, under new codes no record links to the old ones:
//   1. Content it worked on (boards, studies, visuals, teaching materials...)
//      is recorded in DoeRetainedRecord, so termination can still delete it.
//   2. Personal records it owns alone (journals, posts, chat messages,
//      homework, reviews, Connect answers, notifications, logs) are deleted.
//   3. Its photo and intro video are deleted, files included.
//   4. It is removed from every class, network, project and other record.
//   5. Its codes are replaced inside its raw study files and participation
//      records, then on the account, together with every personal field.
// Raw files are rewritten before the database: if a run stops in between, a
// file may carry a code nothing points to, but never the old, known one.
//
// Idempotent: an account with deidentifiedAt is skipped. dryRun only counts.

import { randomBytes } from "crypto";

import { newPublicId, newPublicReadableId } from "../publicIds";
import {
  CONTENT_RELATIONS,
  DELETE_OWNED_RELATIONS,
  accessor,
  relationByField,
  unlinkRelations,
} from "./profileRelations";
import {
  changeStoredJson,
  profileClearedValues,
  replaceCodes,
  stripPersonalKeys,
} from "./personal";
import { rewriteCodesInRawFiles } from "./rawFiles";
import { deleteRecords } from "./deleteRecords";

export type DeidentifyCounts = {
  skipped?: "not-found" | "already-deidentified";
  retainedRecords: number;
  deletedRecords: Record<string, number>;
  filesDeleted: number;
  unlinkedRelations: number;
  participationRecordsUpdated: number;
  rawFilesUpdated: number;
};

/** Ids the account reaches through a relation field. */
async function relatedIds(prisma: any, profileId: string, field: string) {
  const row = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { [field]: { select: { id: true } } },
  });
  return ((row?.[field] as { id: string }[]) || []).map((r) => r.id);
}

/**
 * Deletes the personal records an account owns alone, plus its photo and
 * intro video. Shared with full deletion (purgeDoeData).
 */
export async function deleteOwnedRecords(
  context: any,
  profileId: string,
  dryRun: boolean
): Promise<{ deleted: Record<string, number>; files: number }> {
  const prisma = context.prisma;
  const deleted: Record<string, number> = {};

  for (const field of DELETE_OWNED_RELATIONS) {
    const { model, fk } = relationByField(field);
    if (!fk) continue;
    const where = { [fk]: profileId };
    const ids = (
      await prisma[accessor(model)].findMany({ where, select: { id: true } })
    ).map((r: any) => r.id);
    if (!ids.length) continue;
    deleted[field] = ids.length;
    if (dryRun) continue;
    if (model === "ConnectPreference") {
      await prisma.connectPreferenceItem.deleteMany({
        where: { preferenceId: { in: ids } },
      });
    }
    await prisma[accessor(model)].deleteMany({ where: { id: { in: ids } } });
  }

  let files = 0;
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { imageId: true, introVideoFile_filename: true },
  });
  if (profile?.imageId) {
    files += await deleteRecords(context, "ProfileImage", [profile.imageId], dryRun);
  }
  if (profile?.introVideoFile_filename) {
    files++;
    if (!dryRun) {
      // through Keystone, so the stored video file is removed too
      await context.sudo().db.Profile.updateOne({
        where: { id: profileId },
        data: { introVideoFile: null },
      });
    }
  }
  return { deleted, files };
}

/** Lists and ids of the content an account worked on. */
export async function contentRecords(prisma: any, profileId: string) {
  const records: { listKey: string; itemId: string }[] = [];
  for (const field of CONTENT_RELATIONS) {
    const { model } = relationByField(field);
    for (const itemId of await relatedIds(prisma, profileId, field)) {
      records.push({ listKey: model, itemId });
    }
  }
  const seen = new Set<string>();
  return records.filter((r) => {
    const key = `${r.listKey}:${r.itemId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function uniqueCodes(prisma: any) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const publicId = newPublicId();
    const publicReadableId = newPublicReadableId();
    const taken = await prisma.profile.count({
      where: { OR: [{ publicId }, { publicReadableId }, { username: publicReadableId }] },
    });
    if (!taken) return { publicId, publicReadableId };
  }
  throw new Error("Could not generate unique codes for de-identification.");
}

export async function deidentifyProfile(
  context: any,
  profileId: string,
  { dryRun = true }: { dryRun?: boolean } = {}
): Promise<DeidentifyCounts> {
  const prisma = context.prisma;
  const counts: DeidentifyCounts = {
    retainedRecords: 0,
    deletedRecords: {},
    filesDeleted: 0,
    unlinkedRelations: 0,
    participationRecordsUpdated: 0,
    rawFilesUpdated: 0,
  };

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      publicId: true,
      publicReadableId: true,
      deidentifiedAt: true,
      studiesInfo: true,
      consentsInfo: true,
      tasksInfo: true,
    },
  });
  if (!profile) return { ...counts, skipped: "not-found" };
  if (profile.deidentifiedAt) return { ...counts, skipped: "already-deidentified" };

  // 1. Remember the content it worked on as DOE data, before unlinking it.
  const content = await contentRecords(prisma, profileId);
  const known = content.length
    ? await prisma.doeRetainedRecord.findMany({
        where: {
          OR: content.map((c) => ({ listKey: c.listKey, itemId: c.itemId })),
        },
        select: { listKey: true, itemId: true },
      })
    : [];
  const knownKeys = new Set(known.map((k: any) => `${k.listKey}:${k.itemId}`));
  const toRetain = content.filter((c) => !knownKeys.has(`${c.listKey}:${c.itemId}`));
  counts.retainedRecords = toRetain.length;
  if (!dryRun && toRetain.length) {
    for (const record of toRetain) {
      await prisma.doeRetainedRecord.create({ data: record });
    }
  }

  // 2-3. Personal records, photo and video.
  const owned = await deleteOwnedRecords(context, profileId, dryRun);
  counts.deletedRecords = owned.deleted;
  counts.filesDeleted = owned.files;

  // 5a. New codes, written into raw files first, then participation records.
  const codes = await uniqueCodes(prisma);
  const pairs: [string, string][] = [
    [profile.publicId, codes.publicId],
    [profile.publicReadableId, codes.publicReadableId],
  ];
  const datasets = await prisma.dataset.findMany({
    where: { profileId },
    select: { id: true, token: true, date: true, info: true, messageLog: true, runtimeData: true },
  });
  counts.rawFilesUpdated = await rewriteCodesInRawFiles(datasets, pairs, dryRun);

  const participation: { model: string; rows: any[]; fields: string[]; strip: string[] }[] = [
    { model: "dataset", rows: datasets, fields: ["info", "messageLog", "runtimeData"], strip: ["info"] },
    {
      model: "summaryResult",
      rows: await prisma.summaryResult.findMany({ where: { userId: profileId }, select: { id: true, data: true } }),
      fields: ["data"],
      strip: [],
    },
    {
      model: "studyDataSourceRecord",
      rows: await prisma.studyDataSourceRecord.findMany({
        where: { profileId },
        select: { id: true, steps: true, session: true },
      }),
      fields: ["steps", "session"],
      strip: [],
    },
  ];
  const updates: any[] = [];
  for (const { model, rows, fields, strip } of participation) {
    for (const row of rows) {
      const data: Record<string, unknown> = {};
      for (const field of fields) {
        const result = changeStoredJson(row[field], (parsed) => {
          const recoded = replaceCodes(parsed, pairs);
          return strip.includes(field) ? stripPersonalKeys(recoded) : recoded;
        });
        if (result.changed) data[field] = result.value;
      }
      if (Object.keys(data).length) {
        updates.push(prisma[model].update({ where: { id: row.id }, data }));
      }
    }
  }
  counts.participationRecordsUpdated = updates.length;

  // 4 + 5b. Unlink everything, clear the account, set the new codes.
  const unlink = unlinkRelations();
  counts.unlinkedRelations = unlink.length;
  if (dryRun) return counts;

  const strip = (value: unknown) =>
    changeStoredJson(value, (parsed) => stripPersonalKeys(parsed, true)).value;
  // not a bcrypt hash, so no password can ever match it: sign-in is closed
  const unknownPassword = `!deidentified:${randomBytes(32).toString("hex")}`;
  updates.push(
    prisma.profile.update({
      where: { id: profileId },
      data: {
        ...Object.fromEntries(unlink.map((field) => [field, { set: [] }])),
        ...profileClearedValues(),
        username: codes.publicReadableId,
        email: `deidentified-${codes.publicId}@deidentified.invalid`,
        password: unknownPassword,
        publicId: codes.publicId,
        publicReadableId: codes.publicReadableId,
        studiesInfo: strip(profile.studiesInfo),
        consentsInfo: strip(profile.consentsInfo),
        tasksInfo: strip(profile.tasksInfo),
        deidentifiedAt: new Date(),
      },
    })
  );
  await prisma.$transaction(updates);
  return counts;
}
