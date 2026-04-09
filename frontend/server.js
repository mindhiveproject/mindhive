// server.js
/* eslint-disable no-console */
const express = require("express");
const multer = require("multer");
const next = require("next");
const body = require("body-parser");
const fs = require("fs");
const path = require("path");
const jsonfile = require("jsonfile");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { Client } = require("@notionhq/client");
const notion = new Client({
  auth: process.env.NOTION_KEY,
  notionVersion: "2025-09-03",
});

const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/graphql`;
const prodEndpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL_PRODUCTION}/api/graphql`;

const SAVE_AGGREGATED_RESULTS = `
  mutation createSummaryResult(
    $input: SummaryResultCreateInput!
  ) {
    createSummaryResult(
      data: $input
    ) {
      id
    }
  }
`;

const env = process.env.NODE_ENV;
const dev = env !== "production";
const port = 3000;
const serverUrl = env === "production" ? prodEndpoint : endpoint;

const url = require("url");

// ---------------------------------------------------------------------------
// Security helpers
// ---------------------------------------------------------------------------

// Verify the caller has an active Keystone session by forwarding their cookie.
async function isAuthenticated(req) {
  try {
    const response = await axios({
      method: "post",
      url: serverUrl,
      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.cookie || "",
      },
      data: JSON.stringify({
        query: "{ authenticatedItem { ... on Profile { id } } }",
      }),
    });
    return !!response.data?.data?.authenticatedItem?.id;
  } catch {
    return false;
  }
}

// Validate a path segment so it cannot contain traversal sequences.
// Allowed: alphanumeric, hyphens, underscores, dots (no leading dot).
const SAFE_SEGMENT_RE = /^[a-zA-Z0-9][a-zA-Z0-9_\-\.]{0,63}$/;
function validatePathSegment(value, label) {
  if (typeof value !== "string" || !SAFE_SEGMENT_RE.test(value)) {
    throw new Error(`Invalid ${label}: "${value}"`);
  }
}

// Ensure a resolved path stays inside an expected base directory.
function assertWithinBase(resolvedPath, basePath) {
  if (
    !resolvedPath.startsWith(basePath + path.sep) &&
    resolvedPath !== basePath
  ) {
    throw new Error("Path traversal detected");
  }
}

// ---------------------------------------------------------------------------
// Multer: safe video upload (issue #5)
// Replace originalname with a UUID-based filename; validate extension.
// ---------------------------------------------------------------------------
const ALLOWED_VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".ogg",
  ".mov",
  ".avi",
]);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/videos/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_VIDEO_EXTENSIONS.has(ext)) {
      return cb(new Error(`Unsupported file type: ${ext}`));
    }
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage: storage });

// ---------------------------------------------------------------------------
// Rate limiters (issue #10)
// ---------------------------------------------------------------------------
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const saveDataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const app = next({
  dir: ".",
  dev,
});

const handle = app.getRequestHandler();

let server;
app
  .prepare()
  .then(() => {
    server = express();

    // Issue #11: reduce global body limit from 100mb to a safe default.
    // Individual routes that need larger bodies apply their own parsers.
    // change the limit to 10mb (Apr 7th 2026)
    // Do NOT parse JSON for /api/graphql: Next.js dev rewrites proxy to Keystone must
    // receive the raw request body stream; express.json() consumes it and breaks the proxy.
    server.use((req, res, next) => {
      const pathname = req.url ? req.url.split("?")[0] : "";
      if (pathname === "/api/graphql") {
        return next();
      }
      body.json({ limit: "10mb" })(req, res, next);
    });

    // Serve static files from the 'public' directory
    server.use(express.static(path.join(__dirname, "public")));

    server.get("/api/notion", generalApiLimiter, async (req, res) => {
      const { pageId } = req.query;
      console.log("Received pageId:", pageId);

      if (!pageId) {
        return res
          .status(400)
          .json({ error: "Missing pageId query parameter" });
      }

      try {
        const dbResponse = await notion.databases.retrieve({
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

        let results = [];
        let hasMore = true;
        let start_cursor = undefined;

        while (hasMore) {
          const response = await notion.dataSources.query({
            data_source_id: dataSourceId,
            start_cursor,
            page_size: 100,
          });
          results = results.concat(response.results);
          hasMore = response.has_more;
          start_cursor = response.next_cursor;
        }
        res.json(results);
      } catch (error) {
        console.error("Error retrieving Notion database pages:", error);
        const code = error?.code;
        const body = error?.body;
        const isValidationError =
          body?.code === "validation_error" ||
          (body?.message &&
            (String(body.message).includes(
              "multiple_data_sources_for_database",
            ) ||
              String(body.message).includes("minimum_api_version")));
        if (isValidationError) {
          return res.status(400).json({
            error:
              "Notion API validation error. This integration uses API version 2025-09-03 and data source resolution.",
            details: body?.message || code,
          });
        }
        res
          .status(500)
          .json({ error: "Failed to retrieve Notion database pages" });
      }
    });

    // Issue #3: require authentication before writing template files.
    // Issue #4: validate the `name` param to prevent path traversal.
    server.post(
      "/api/templates/upload",
      generalApiLimiter,
      body.json({ limit: "10mb" }),
      async (req, res) => {
        // Authentication check
        const authenticated = await isAuthenticated(req);
        if (!authenticated) {
          return res.status(401).json({ error: "Authentication required." });
        }

        const { name, script, file } = req.body;

        // Validate template name to prevent path traversal (issue #4 equivalent)
        try {
          validatePathSegment(name, "template name");
        } catch (e) {
          return res.status(400).json({ error: e.message });
        }

        const dirTemplates = path.resolve(__dirname, "templates");
        const dir = path.resolve(dirTemplates, name);

        // Ensure resolved path stays within templates base directory
        try {
          assertWithinBase(dir, dirTemplates);
        } catch (e) {
          return res.status(400).json({ error: "Invalid template name." });
        }

        !fs.existsSync(dirTemplates) && fs.mkdirSync(dirTemplates);
        !fs.existsSync(dir) && fs.mkdirSync(dir);

        const filePathScript = path.join(dir, "script.txt");
        const filePathFile = path.join(dir, "file.json");

        jsonfile.writeFile(filePathFile, file, function (err) {
          if (err) console.error(err);
        });

        fs.writeFile(filePathScript, script, function (err) {
          if (err) {
            return console.log(err);
          }
        });

        const scriptAddress = `/templates/${name}/script.txt`;
        const fileAddress = `/templates/${name}/file.json`;

        res.send({
          message: { scriptAddress, fileAddress },
          status: 201,
          statusText: "Saved",
        });
      },
    );

    // Issue #4: validate all path components to prevent directory traversal.
    server.post(
      "/api/save",
      saveDataLimiter,
      body.json({ limit: "50mb" }),
      async (req, res) => {
        const { metadata, data } = req.body;
        const { id, payload } = metadata;

        const year = req.query.y;
        const month = req.query.m;
        const day = req.query.d;

        // Validate every segment used to build the file path
        try {
          validatePathSegment(year, "year");
          validatePathSegment(month, "month");
          validatePathSegment(day, "day");
          validatePathSegment(id, "id");
          validatePathSegment(payload, "payload");
        } catch (e) {
          return res.status(400).json({ error: e.message });
        }

        const dirData = path.resolve(__dirname, "data");
        const dir = path.resolve(dirData, year, month, day, id);

        // Confirm the resolved path is still within the data directory
        try {
          assertWithinBase(dir, dirData);
        } catch (e) {
          return res.status(400).json({ error: "Invalid path parameters." });
        }

        !fs.existsSync(dirData) && fs.mkdirSync(dirData);
        !fs.existsSync(path.resolve(dirData, year)) &&
          fs.mkdirSync(path.resolve(dirData, year));
        !fs.existsSync(path.resolve(dirData, year, month)) &&
          fs.mkdirSync(path.resolve(dirData, year, month));
        !fs.existsSync(path.resolve(dirData, year, month, day)) &&
          fs.mkdirSync(path.resolve(dirData, year, month, day));
        !fs.existsSync(dir) && fs.mkdirSync(dir);

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
            function (err) {
              if (err) console.error(err);
            },
          );
        } else {
          jsonfile.writeFile(
            filePath,
            {
              ...req.body,
              metadata: { ...req.body.metadata, ...enhancedMetadata },
            },
            { flag: "a", EOL: ",\n" },
            function (err) {
              if (err) console.error(err);
            },
          );
        }

        // save aggregated data
        if (payload === "full") {
          const aggregated = data
            .filter((row) => row.aggregated)
            .map((row) => row.aggregated)
            .reduce((prev, current) => ({ ...prev, ...current }), {});

          await axios({
            method: "post",
            url: serverUrl,
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
                  study:
                    req.query.st === "undefined"
                      ? null
                      : { connect: { id: req.query.st } },
                  template:
                    req.query.te === "undefined"
                      ? null
                      : { connect: { id: req.query.te } },
                  task:
                    req.query.ta === "undefined"
                      ? null
                      : { connect: { id: req.query.ta } },
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

        res.send({
          message: "The data was sent successfully",
          status: 202,
          statusText: "it worked",
        });
      },
    );

    server.post(
      "/api/upload",
      generalApiLimiter,
      upload.single("video"),
      async (req, res) => {
        if (!req.file) {
          return res.status(400).send("No file uploaded.");
        }
        res.json({ filename: req.file.filename });
      },
    );

    server.post("*", (req, res) => {
      const parsedUrl = url.parse(req.url || "", true);
      return handle(req, res, parsedUrl);
    });

    // Default catch-all handler to allow Next.js to handle all other routes.
    // Pass parsedUrl so Next.js uses consistent pathname+query (fixes 404 on reload
    // for /builder/projects?selector=... and on-demand-entries fetches).
    server.get("*", (req, res) => {
      const parsedUrl = url.parse(req.url || "", true);
      return handle(req, res, parsedUrl);
    });

    server.listen(port, (err) => {
      if (err) {
        throw err;
      }
      console.log(`> Ready on port ${port} [${env}]`);
    });
  })
  .catch((err) => {
    console.log("An error occurred, unable to start the server");
    console.log(err);
  });
