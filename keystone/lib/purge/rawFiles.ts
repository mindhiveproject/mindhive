// Raw study files: frontend/pages/api/save.ts writes each run to
// <frontend>/data/YYYY/MM/DD/<dataset token>/<payload>.json. Frontend and
// backend run on the same server, so the backend reaches them directly.
// RAW_DATA_DIR overrides the location (default: ../frontend/data, relative
// to the keystone directory the backend runs in).

import path from "path";
import { promises as fs } from "fs";

const SEGMENT = /^[A-Za-z0-9_-]+$/;

export type RawDataset = { token: string | null; date: string | null };

export function rawDataDir(): string {
  return path.resolve(
    process.env.RAW_DATA_DIR || path.join(process.cwd(), "..", "frontend", "data")
  );
}

/** The dataset's folder, or null for a missing or unsafe token or date. */
export function datasetFolder(dataset: RawDataset): string | null {
  const { token, date } = dataset;
  if (!token || !date) return null;
  const [year, month, day] = String(date).split("-");
  if (![year, month, day, token].every((s) => s && SEGMENT.test(s))) return null;
  const base = rawDataDir();
  const dir = path.resolve(base, year, month, day, token);
  return dir.startsWith(base + path.sep) ? dir : null;
}

/** Files in the dataset's folder, empty when it does not exist. */
async function folderFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => path.join(dir, e.name));
  } catch (error: any) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

/** Replaces old codes with new ones inside the datasets' raw files. */
export async function rewriteCodesInRawFiles(
  datasets: RawDataset[],
  pairs: [string, string][],
  dryRun: boolean
): Promise<number> {
  let changed = 0;
  for (const dataset of datasets) {
    const dir = datasetFolder(dataset);
    if (!dir) continue;
    for (const file of await folderFiles(dir)) {
      const text = await fs.readFile(file, "utf8");
      let next = text;
      for (const [from, to] of pairs) {
        if (from) next = next.split(from).join(to);
      }
      if (next === text) continue;
      changed++;
      if (!dryRun) await fs.writeFile(file, next, "utf8");
    }
  }
  return changed;
}

/** Deletes the datasets' raw folders; counts the folders that existed. */
export async function deleteRawFolders(
  datasets: RawDataset[],
  dryRun: boolean
): Promise<number> {
  let deleted = 0;
  for (const dataset of datasets) {
    const dir = datasetFolder(dataset);
    if (!dir) continue;
    try {
      await fs.access(dir);
    } catch {
      continue;
    }
    deleted++;
    if (!dryRun) await fs.rm(dir, { recursive: true, force: true });
  }
  return deleted;
}
