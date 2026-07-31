import path from "path";
import fs from "fs";
import jsonfile from "jsonfile";
import type { NextApiRequest, NextApiResponse } from "next";
import { generalApiLimiter } from "../../../lib/api/rateLimit";
import { isAuthenticated } from "../../../lib/api/auth";
import { validatePathSegment, assertWithinBase } from "../../../lib/api/paths";

export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
  },
};

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

  const { name, script, file } = req.body;

  try {
    validatePathSegment(name, "template name");
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }

  const dirTemplates = path.resolve(process.cwd(), "templates");
  const dir = path.resolve(dirTemplates, name);

  try {
    assertWithinBase(dir, dirTemplates);
  } catch (e) {
    return res.status(400).json({ error: "Invalid template name." });
  }

  await fs.promises.mkdir(dir, { recursive: true });

  const filePathScript = path.join(dir, "script.txt");
  const filePathFile = path.join(dir, "file.json");

  jsonfile.writeFile(filePathFile, file, (err) => {
    if (err) console.error(err);
  });

  fs.writeFile(filePathScript, script, (err) => {
    if (err) console.log(err);
  });

  const scriptAddress = `/templates/${name}/script.txt`;
  const fileAddress = `/templates/${name}/file.json`;

  res.status(200).json({
    message: { scriptAddress, fileAddress },
    status: 201,
    statusText: "Saved",
  });
}
