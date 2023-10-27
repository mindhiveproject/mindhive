import path from "path";
import { promises as fs } from "fs";

export default async function handler(req, res) {
  const { query } = req;
  const { slug, type } = query;

  // Find the absolute path of the json directory
  const directory = path.join(process.cwd(), "templates");

  if (type === "file") {
    // Read the file
    const fileContents = await fs.readFile(
      directory + `/${slug}/file.json`,
      "utf8"
    );
    // Return the content of the data file in json format
    res.status(200).json(fileContents);
  } else {
    res.sendFile(directory + `/${slug}/script.txt`);
  }
}
