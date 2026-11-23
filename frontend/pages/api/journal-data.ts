import path from "path";
import fs from "fs";
import jsonfile from "jsonfile";
import type { NextApiRequest, NextApiResponse } from "next";
import { saveDataLimiter } from "../../lib/api/rateLimit";
import { validatePathSegment, assertWithinBase } from "../../lib/api/paths";
import { isAuthenticated } from "../../lib/api/auth";
import {
  backendGraphqlAsCaller,
  CAN_WRITE_DATASOURCE_FILE,
} from "../../lib/api/graphql";

// Data Journal file store: CSV/JSON uploads ("upload") and edited copies
// ("modified"). Lab.js run results go through /api/save, which only accepts
// server-issued run tokens. Files land where /api/data/[y]/[m]/[d]/[token]
// reads them back.
//
// Writing a new file (a fresh token) only needs a signed-in user. Replacing
// anything in an existing file folder needs ?datasource=<id> naming a dataset
// that points at it and that the caller edits in place (its author, or a
// collaborator while collaboratorsCanEdit is on) —
// keystone/mutations/dataFileAccess.ts canWriteDatasourceFile.

async function callerMayReplace(
  req: NextApiRequest,
  token: string,
  datasourceId: string | null
) {
  if (!datasourceId || !req.headers.cookie) return false;
  try {
    const data = await backendGraphqlAsCaller(req, CAN_WRITE_DATASOURCE_FILE, {
      datasourceId,
      token,
    });
    return data?.canWriteDatasourceFile === true;
  } catch {
    return false;
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "50mb" },
  },
};

const ALLOWED_PAYLOADS = ["upload", "modified"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  if (!saveDataLimiter(req, res)) return;
  if (!(await isAuthenticated(req))) {
    return res.status(401).json({ error: "You must be signed in." });
  }

  const { metadata, data } = req.body || {};
  if (!metadata || typeof metadata !== "object" || !Array.isArray(data)) {
    return res.status(400).json({ error: "Invalid data file payload." });
  }
  const { id, payload } = metadata;
  const year = String(req.query.y);
  const month = String(req.query.m);
  const day = String(req.query.d);

  try {
    validatePathSegment(year, "year");
    validatePathSegment(month, "month");
    validatePathSegment(day, "day");
    validatePathSegment(id, "id");
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
  if (!ALLOWED_PAYLOADS.includes(payload)) {
    return res.status(400).json({ error: `Invalid payload: "${payload}"` });
  }

  const dirData = path.resolve(process.cwd(), "data");
  const dir = path.resolve(dirData, year, month, day, id);
  try {
    assertWithinBase(dir, dirData);
  } catch {
    return res.status(400).json({ error: "Invalid path parameters." });
  }
  const filePath = path.join(dir, `${payload}.json`);

  const folderExists = await fs.promises
    .stat(dir)
    .then((st) => st.isDirectory())
    .catch(() => false);
  if (folderExists) {
    const datasourceId =
      typeof req.query.datasource === "string" ? req.query.datasource : null;
    if (!(await callerMayReplace(req, id, datasourceId))) {
      return res
        .status(403)
        .json({ error: "You cannot change this dataset's data." });
    }
  }

  try {
    await fs.promises.mkdir(dir, { recursive: true });
    // "modified" is read back as plain JSON; "upload" keeps the legacy
    // trailing ",\n" that the reader strips.
    await jsonfile.writeFile(
      filePath,
      req.body,
      payload === "modified" ? {} : ({ EOL: ",\n" } as any)
    );
  } catch {
    return res.status(500).json({ error: "The data file could not be stored." });
  }

  return res.status(200).json({ message: "The data was saved successfully" });
}
