import path from "path";
import { promises as fs } from "fs";
import { validatePathSegment, assertWithinBase } from "../../../../../../lib/api/paths";
import {
  backendGraphqlAsCaller,
  CAN_READ_DATASOURCE_FILE,
  READABLE_DATASET_TOKENS,
} from "../../../../../../lib/api/graphql";

// Reads one raw data file. The caller must be signed in and allowed to read
// it: a study dataset by the dataset rules, or, with ?datasource=<id>, a Data
// Journal file of a datasource they can read (keystone/mutations/dataFileAccess).
async function callerMayRead(req, token, datasourceId) {
  if (!req.headers.cookie) return false;
  try {
    if (datasourceId) {
      const data = await backendGraphqlAsCaller(req, CAN_READ_DATASOURCE_FILE, {
        datasourceId,
        token,
      });
      return data?.canReadDatasourceFile === true;
    }
    const data = await backendGraphqlAsCaller(req, READABLE_DATASET_TOKENS, {
      tokens: [token],
    });
    return (data?.readableDatasetTokens || []).includes(token);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const { query } = req;
  const { year, month, day, token, type, datasource } = query;

  try {
    validatePathSegment(year, "year");
    validatePathSegment(month, "month");
    validatePathSegment(day, "day");
    validatePathSegment(token, "token");
    validatePathSegment(type, "type");
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  if (!(await callerMayRead(req, token, typeof datasource === "string" ? datasource : null))) {
    return res.status(403).json({ error: "You do not have access to this data." });
  }

  // Find the absolute path of the json directory
  const jsonDirectory = path.join(process.cwd(), "data");
  const filePath = path.join(jsonDirectory, year, month, day, token, `${type}.json`);
  try {
    assertWithinBase(filePath, jsonDirectory);
  } catch (e) {
    return res.status(400).json({ error: "Invalid path parameters." });
  }

  // Read the json data file data.json
  const fileContents = await fs.readFile(filePath, "utf8");

  // Return the content of the data file in json format
  res.status(200).json(fileContents);
}
