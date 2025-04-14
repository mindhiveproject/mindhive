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
require("dotenv").config();

const { Client } = require("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_KEY });

const endpoint = `http://localhost:4444/api/graphql`;
const prodEndpoint = `https://backend.mindhive.science/api/graphql`;

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

const app = next({
  dir: ".", // base directory where everything is, could move to src later
  dev,
});

const handle = app.getRequestHandler();

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/videos/"); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

let server;
app
  .prepare()
  .then(() => {
    server = express();

    server.use(body.json({ limit: "100mb" }));

    // Serve static files from the 'public' directory
    server.use(express.static(path.join(__dirname, "public")));

    server.get("/api/notion", async (req, res) => {
      const { pageId } = req.query;
      console.log("Received pageId:", pageId);

      try {
        // Query the database to get its pages
        const response = await notion.databases.query({
          database_id: pageId,
        });
        res.json(response.results); // Return the pages (rows) of the database
      } catch (error) {
        console.error("Error retrieving Notion database pages:", error);
        res
          .status(500)
          .json({ error: "Failed to retrieve Notion database pages" });
      }
    });

    server.post("/api/templates/upload", async (req, res) => {
      const { name, script, file } = req.body;

      // check whether the folder "data" exists
      const dirTemplates = path.join(__dirname, "templates");
      !fs.existsSync(dirTemplates) && fs.mkdirSync(dirTemplates);
      const dir = path.join(dirTemplates, name);
      !fs.existsSync(dir) && fs.mkdirSync(dir);

      const filePathScript = path.join(dir, "script.txt");
      const filePathFile = path.join(dir, "file.json");

      await jsonfile.writeFile(filePathFile, file, function (err) {
        if (err) console.error(err);
      });

      await fs.writeFile(filePathScript, script, function (err) {
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
    });

    server.post("/api/save", async (req, res) => {
      const { metadata, data } = req.body;
      const { id, payload } = metadata;

      const year = req.query.y;
      const month = req.query.m;
      const day = req.query.d;

      // check whether the folder "data" exists
      const dirData = path.join(__dirname, "data");
      !fs.existsSync(dirData) && fs.mkdirSync(dirData);
      // check whether the folder with year exists
      const dirDataYear = path.join(dirData, year);
      !fs.existsSync(dirDataYear) && fs.mkdirSync(dirDataYear);
      // check whether the folder with month exists
      const dirDataYearMonth = path.join(dirDataYear, month);
      !fs.existsSync(dirDataYearMonth) && fs.mkdirSync(dirDataYearMonth);
      // check whether the folder with date exists
      const dirDataYearMonthDay = path.join(dirDataYearMonth, day);
      !fs.existsSync(dirDataYearMonthDay) && fs.mkdirSync(dirDataYearMonthDay);
      // check whether the folder with result ID exists
      const dir = path.join(dirDataYearMonthDay, id);
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
          }
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
          }
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
    });

    server.post("/api/upload", upload.single("video"), async (req, res) => {
      if (!req.file) {
        return res.status(400).send("No file uploaded.");
      }
      // Send the file URL back to the client
      res.json({ filename: req.file.filename });
    });

    server.post("*", (req, res) => {
      return handle(req, res);
    });

    // Default catch-all handler to allow Next.js to handle all other routes
    server.get("*", (req, res) => handle(req, res));

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
