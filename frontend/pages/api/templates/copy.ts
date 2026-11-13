import path from "path";
import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import { generalApiLimiter } from "../../../lib/api/rateLimit";
import { isAuthenticated } from "../../../lib/api/auth";
import { validatePathSegment, assertWithinBase } from "../../../lib/api/paths";

// Copies a template's files (script.txt, file.json) to a new template's
// folder, when a task gets its own copy of its template (forkTaskTemplate).
// It never writes into a folder that already has files, so it cannot change
// an existing template.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  if (!generalApiLimiter(req, res)) return;

  const authenticated = await isAuthenticated(req);
  if (!authenticated) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const { from, to } = req.body || {};
  try {
    validatePathSegment(from, "source template");
    validatePathSegment(to, "new template");
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
  if (from === to) {
    return res.status(400).json({ error: "The new template needs its own name." });
  }

  const base = path.resolve(process.cwd(), "templates");
  const source = path.resolve(base, from);
  const target = path.resolve(base, to);
  try {
    assertWithinBase(source, base);
    assertWithinBase(target, base);
  } catch (e) {
    return res.status(400).json({ error: "Invalid template name." });
  }

  const existing = await fs.promises.readdir(target).catch(() => []);
  if (existing.length) {
    return res.status(409).json({ error: "That template already has files." });
  }

  try {
    await fs.promises.mkdir(target, { recursive: true });
    for (const name of ["script.txt", "file.json"]) {
      const from = path.join(source, name);
      // a template may have no data file yet
      if (fs.existsSync(from)) {
        await fs.promises.copyFile(from, path.join(target, name));
      }
    }
  } catch (e) {
    console.error("Template copy failed:", e);
    await fs.promises.rm(target, { recursive: true, force: true }).catch(() => {});
    return res.status(500).json({ error: "The template's files could not be copied." });
  }

  res.status(200).json({
    scriptAddress: `/templates/${to}/script.txt`,
    fileAddress: `/templates/${to}/file.json`,
  });
}
