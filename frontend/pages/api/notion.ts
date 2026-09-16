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

/**
 * This route is unauthenticated by design — it feeds the public teachers page.
 * Without an allowlist that makes it an open proxy: it would return the full
 * contents of *any* database the integration can see, to anyone who guesses or
 * learns an id. The blast radius grows every time a database is shared with
 * the integration for an unrelated reason, which is exactly what happened when
 * the Platform Tickets page was connected.
 *
 * So the route serves only ids it has been told to serve. Everything else is a
 * 403, whether or not the integration could technically read it.
 *
 * To publish another Notion database here, add its id to
 * NOTION_PUBLIC_PAGE_IDS (comma-separated) — never by loosening this check.
 */
const normalizeId = (value: string) => value.replace(/-/g, "").trim().toLowerCase();

const ALLOWED_PAGE_IDS = new Set(
  [
    process.env.NEXT_PUBLIC_NOTION_TEACHERS_PAGE_ID,
    ...(process.env.NOTION_PUBLIC_PAGE_IDS || "").split(","),
  ]
    .filter((id): id is string => !!id && id.trim().length > 0)
    .map(normalizeId)
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }
  if (!generalApiLimiter(req, res)) return;

  const { pageId } = req.query;

  if (!pageId || typeof pageId !== "string") {
    return res.status(400).json({ error: "Missing pageId query parameter" });
  }

  if (!ALLOWED_PAGE_IDS.has(normalizeId(pageId))) {
    // Deliberately does not say whether the id exists or the integration can
    // read it — a 403 either way, so this cannot be used to probe the
    // workspace for shared databases.
    return res.status(403).json({ error: "This page is not published." });
  }

  try {
    const dbResponse: any = await notion.databases.retrieve({
      database_id: pageId,
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
