// server.js
/* eslint-disable no-console */
const express = require("express");
const next = require("next");
const body = require("body-parser");
const fs = require("fs");
const path = require("path");

// const devProxy = {
//   "/.netlify": {
//     target: "http://localhost:9000",
//     pathRewrite: { "^/.netlify/functions": "" },
//   },
// };

const env = process.env.NODE_ENV;
const dev = env !== "production";
const port = env === "production" ? 5555 : 3000;

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

    server.post("/api/save", (req, res) => {
      const { metadata, data } = req.body;
      const { slice, id, payload } = metadata;

      const dir = path.join(__dirname, "data", id);

      !fs.existsSync(dir) && fs.mkdirSync(dir);
      const filePath = path.join(dir, payload + ".txt");

      fs.writeFile(
        filePath,
        JSON.stringify(req.body) + ",",
        { flag: "a" },
        (err) => {
          if (err) {
            throw err;
          }
        }
      );

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
