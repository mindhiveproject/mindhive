// Everything MindHive holds on one account, as plain JSON: for DOE to answer a
// family's request to inspect or copy a student's data (Agreement section
// 4(b)), and to hand a school's student work to DOE before deletion.
//
// Built from the Prisma schema like the purge routines, so a record added to
// accounts later is exported by default. Left out: secrets (passwords, reset
// tokens, including dataset tokens, which open the raw-data download route)
// and other people's accounts (who follows or favourited this one).

import { Prisma } from "@prisma/client";

import { profileRelations } from "../purge/profileRelations";
import { datasetFolder } from "../purge/rawFiles";
import path from "path";
import { promises as fs } from "fs";

const SECRET = /password|token/i;

/** Other people's data reached through this account: not exported. */
const SKIP_RELATIONS = new Set([
  "favoriteBy",
  "favoritePeople",
  "teamPreferencesReceived",
  "permissions",
]);

function scalarSelect(model: string): Record<string, true> {
  const fields =
    Prisma.dmmf.datamodel.models.find((m) => m.name === model)?.fields || [];
  return Object.fromEntries(
    fields
      .filter((f) => f.kind !== "object" && !SECRET.test(f.name))
      .map((f) => [f.name, true])
  );
}

function relationSelect(model: string) {
  if (model === "ProposalBoard") {
    // a board's content lives in its sections and cards
    return {
      ...scalarSelect("ProposalBoard"),
      sections: {
        select: {
          ...scalarSelect("ProposalSection"),
          cards: { select: scalarSelect("ProposalCard") },
        },
      },
    };
  }
  return scalarSelect(model);
}

async function rawFilesOf(
  datasets: { id: string; token: string | null; date: string | null }[]
) {
  const files: { dataset: string; name: string; content: string }[] = [];
  for (const dataset of datasets) {
    const dir = datasetFolder(dataset);
    if (!dir) continue;
    let names: string[] = [];
    try {
      names = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      files.push({
        dataset: dataset.id, // never the token, which opens the raw-data route
        name,
        content: await fs.readFile(path.join(dir, name), "utf8"),
      });
    }
  }
  return files;
}

export type PersonExport = {
  account: Record<string, unknown>;
  records: Record<string, unknown[]>;
  rawFiles?: { dataset: string; name: string; content: string }[];
};

export async function exportPerson(
  prisma: any,
  profileId: string,
  { includeRawFiles = true }: { includeRawFiles?: boolean } = {}
): Promise<PersonExport | null> {
  const account = await prisma.profile.findUnique({
    where: { id: profileId },
    select: scalarSelect("Profile"),
  });
  if (!account) return null;

  const records: Record<string, unknown[]> = {};
  for (const { field, model } of profileRelations()) {
    if (SKIP_RELATIONS.has(field) || model === "Profile") continue;
    const row = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { [field]: { select: relationSelect(model) } },
    });
    const value = row?.[field];
    const list = Array.isArray(value) ? value : value ? [value] : [];
    if (list.length) records[field] = list;
  }

  const result: PersonExport = { account, records };
  if (includeRawFiles) {
    // tokens are left out of the export above, so look them up here
    const datasets = await prisma.dataset.findMany({
      where: { profileId },
      select: { id: true, token: true, date: true },
    });
    result.rawFiles = await rawFilesOf(datasets);
  }
  return result;
}
