import path from "path";
import fs from "fs";
import jsonfile from "jsonfile";
import type { NextApiRequest, NextApiResponse } from "next";
import { saveDataLimiter } from "../../lib/api/rateLimit";
import { validatePathSegment, assertWithinBase } from "../../lib/api/paths";
import { isAuthenticated } from "../../lib/api/auth";

// Data Journal file store: CSV/JSON uploads ("upload") and edited copies
// ("modified"). Lab.js run results go through /api/save, which only accepts
// server-issued run tokens. Files land where /api/data/[y]/[m]/[d]/[token]
// reads them back.

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
