import path from "path";
import fs from "fs";
import jsonfile from "jsonfile";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { saveDataLimiter } from "../../lib/api/rateLimit";
import { validatePathSegment, assertWithinBase } from "../../lib/api/paths";
import { serverGraphqlUrl, SAVE_AGGREGATED_RESULTS } from "../../lib/api/graphql";

export const config = {
  api: {
    bodyParser: { sizeLimit: "50mb" },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  if (!saveDataLimiter(req, res)) return;

  const { metadata, data } = req.body;
  const { id, payload } = metadata;

  const year = req.query.y as string;
  const month = req.query.m as string;
  const day = req.query.d as string;

  try {
    validatePathSegment(year, "year");
    validatePathSegment(month, "month");
    validatePathSegment(day, "day");
    validatePathSegment(id, "id");
    validatePathSegment(payload, "payload");
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }

  const dirData = path.resolve(process.cwd(), "data");
  const dir = path.resolve(dirData, year, month, day, id);

  try {
    assertWithinBase(dir, dirData);
  } catch (e) {
    return res.status(400).json({ error: "Invalid path parameters." });
  }

  await fs.promises.mkdir(dir, { recursive: true });

  const filePath = path.join(dir, payload + ".json");

  const enhancedMetadata = {
    study: req.query.st === "undefined" ? null : req.query.st,
    template: req.query.te === "undefined" ? null : req.query.te,
    task: req.query.ta === "undefined" ? null : req.query.ta,
    type: req.query.type === "guest" ? "GUEST" : "USER",
    testVersion: req.query.v === "undefined" ? null : req.query.v,
    publicId: req.query.upid === "undefined" ? null : req.query.upid,
  };

  // in case if a modified data file is uploaded, replace the existing file
  if (payload === "modified") {
    jsonfile.writeFile(
      filePath,
      {
        ...req.body,
        metadata: { ...req.body.metadata, ...enhancedMetadata },
      },
      (err) => {
        if (err) console.error(err);
      }
    );
  } else {
    jsonfile.writeFile(
      filePath,
      {
        ...req.body,
        metadata: { ...req.body.metadata, ...enhancedMetadata },
      },
      { flag: "a", EOL: ",\n" } as any,
      (err) => {
        if (err) console.error(err);
      }
    );
  }

  // save aggregated data
  if (payload === "full") {
    const aggregated = (data as any[])
      .filter((row) => row.aggregated)
      .map((row) => row.aggregated)
      .reduce((prev, current) => ({ ...prev, ...current }), {});

    await axios({
      method: "post",
      url: serverGraphqlUrl,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        query: SAVE_AGGREGATED_RESULTS,
        operationName: "createSummaryResult",
        variables: {
          input: {
            metadataId: id,
            data: aggregated,
            study: req.query.st === "undefined" ? null : { connect: { id: req.query.st } },
            template: req.query.te === "undefined" ? null : { connect: { id: req.query.te } },
            task: req.query.ta === "undefined" ? null : { connect: { id: req.query.ta } },
            user:
              req.query.us === "undefined" || req.query.type === "guest"
                ? null
                : { connect: { id: req.query.us } },
            guest:
              req.query.us === "undefined" || req.query.type === "user"
                ? null
                : { connect: { id: req.query.us } },
            type: req.query.type === "guest" ? "GUEST" : "USER",
            testVersion: req.query.v === "undefined" ? null : req.query.v,
          },
        },
      }),
    });
  }

  res.status(200).json({
    message: "The data was sent successfully",
    status: 202,
    statusText: "it worked",
  });
}
