import path from "path";
import { promises as fs } from "fs";
import { validatePathSegment, assertWithinBase } from "../../../../../../lib/api/paths";

export default async function handler(req, res) {
  const { query } = req;
  const { year, month, day, token, type } = query;

  try {
    validatePathSegment(year, "year");
    validatePathSegment(month, "month");
    validatePathSegment(day, "day");
    validatePathSegment(token, "token");
    validatePathSegment(type, "type");
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  // Find the absolute path of the json directory
  const jsonDirectory = path.join(process.cwd(), "data");
  const filePath = path.join(jsonDirectory, year, month, day, token, `${type}.json`);
  try {
    assertWithinBase(filePath, jsonDirectory);
  } catch (e) {
    return res.status(400).json({ error: "Invalid path parameters." });
  }

  let fileContents;
  try {
    fileContents = await fs.readFile(filePath, "utf8");
  } catch (e) {
    if (e?.code === "ENOENT") {
      return res.status(404).json({ error: "Data file not found." });
    }
    return res.status(500).json({ error: "The data file could not be read." });
  }

  // Return the content of the data file in json format
  res.status(200).json(fileContents);
}
