// server.js
/* eslint-disable no-console */
const express = require("express");
const next = require("next");
const body = require("body-parser");
const fs = require("fs");
const path = require("path");
const jsonfile = require('jsonfile')
const axios = require("axios");

const endpoint = `http://localhost:4444/api/graphql`;
const prodEndpoint = `https://dev-backend.mindhive.science/api/graphql`;

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
const port = env === "production" ? 5555 : 3000;
const serverUrl = env === "production" ? prodEndpoint : endpoint;

const app = next({
  dir: ".", // base directory where everything is, could move to src later
  dev,
});

const handle = app.getRequestHandler();

let server;
app
  .prepare()
  .then(() => {
    server = express();

    // Set up the proxy.
    // if (dev && devProxy) {
    //   const { createProxyMiddleware } = require("http-proxy-middleware");
    //   Object.keys(devProxy).forEach(function (context) {
    //     server.use(createProxyMiddleware(context, devProxy[context]));
    //   });
    // }

    server.use(body.json());

    server.post("/api/save", async (req, res) => {

      console.log(req.query);

      const { metadata, data } = req.body;
      const { slice, id, payload } = metadata;

      const dir = path.join(__dirname, "data", id);

      !fs.existsSync(dir) && fs.mkdirSync(dir);
      const filePath = path.join(dir, payload + ".json");

      jsonfile.writeFile(filePath, req.body, { flag: 'a', EOL: ',\n' }, function (err) {
        if (err) console.error(err)
      })

      // save aggregated data
      if(payload === "full") {
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
                study: req.query.st === "undefined" ? null : { connect: { id: req.query.st } },
                template:  req.query.te === "undefined" ? null : { connect: { id: req.query.te } },
                task: req.query.ta === "undefined" ? null : { connect: { id: req.query.ta } },
                user: (req.query.us === "undefined" || req.query.type === "guest") ? null: { connect: { id: req.query.us } },
                guest: (req.query.us === "undefined" || req.query.type === "user") ? null: { connect: { id: req.query.us } },
                type: req.query.type === "guest" ? "GUEST" : "USER",
              }
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
