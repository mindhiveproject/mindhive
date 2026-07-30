import type { NextApiRequest, NextApiResponse } from "next";
import { Client } from "@notionhq/client";
import { generalApiLimiter } from "../../lib/api/rateLimit";

// The old Express route had no response cap; large Notion databases can
// exceed Next's 4MB warning threshold.
export const config = {
  api: {
    responseLimit: false,
  },
};

const notion = new Client({
  auth: process.env.NOTION_KEY,
  notionVersion: "2025-09-03",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }
  if (!generalApiLimiter(req, res)) return;

  const { pageId } = req.query;
  console.log("Received pageId:", pageId);

  if (!pageId) {
    return res.status(400).json({ error: "Missing pageId query parameter" });
  }

  try {
    const dbResponse: any = await notion.databases.retrieve({
      database_id: pageId as string,
    });
    const dataSources = dbResponse.data_sources;
    if (!dataSources || dataSources.length === 0) {
      return res.status(502).json({
        error:
          "Database has no data sources; Notion API 2025-09-03 requires at least one data source.",
      });
    }
    const dataSourceId = dataSources[0].id;

    let results: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const response: any = await (notion as any).dataSources.query({
        data_source_id: dataSourceId,
        start_cursor: startCursor,
        page_size: 100,
      });
      results = results.concat(response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }
    res.json(results);
  } catch (error: any) {
    console.error("Error retrieving Notion database pages:", error);
    const code = error?.code;
    const body = error?.body;
    const isValidationError =
      body?.code === "validation_error" ||
      (body?.message &&
        (String(body.message).includes("multiple_data_sources_for_database") ||
          String(body.message).includes("minimum_api_version")));
    if (isValidationError) {
      return res.status(400).json({
        error:
          "Notion API validation error. This integration uses API version 2025-09-03 and data source resolution.",
        details: body?.message || code,
      });
    }
    res.status(500).json({ error: "Failed to retrieve Notion database pages" });
  }
}
