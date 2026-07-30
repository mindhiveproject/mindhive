import path from "path";
import { promises as fs } from "fs";
import { validatePathSegment, assertWithinBase } from "../../../../lib/api/paths";

export default async function handler(req, res) {
  const { query } = req;
  const { slug, type } = query;

  try {
    validatePathSegment(slug, "slug");
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  // Find the absolute path of the json directory
  const directory = path.join(process.cwd(), "templates");
  const dir = path.join(directory, slug);
  try {
    assertWithinBase(dir, directory);
  } catch (e) {
    return res.status(400).json({ error: "Invalid slug." });
  }

  if (type === "file") {
    // Read the file
    const fileContents = await fs.readFile(
      path.join(dir, "file.json"),
      "utf8"
    );
    // Return the content of the data file in json format
    res.status(200).json(fileContents);
  } else {
    const script = await fs.readFile(path.join(dir, "script.txt"), "utf8");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(script);
  }
}
