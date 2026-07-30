import path from "path";
import { assertWithinBase } from "../../../lib/api/paths";

const fs = require("fs");

// The old Express server parsed every body with a 10mb limit before Next saw
// the request; without this override Next's 1mb default would reject large
// fileDirs lists from big studies.
export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
    responseLimit: false, // raw study data downloads routinely exceed Next's 4MB warning threshold
  },
};

export default async function handler(req, res) {
  const { fileDirs } = req.body;

  // Find the absolute path of the json directory
  const jsonDirectory = path.join(process.cwd(), "data");

  const promises = fileDirs.map(function (_path) {
    return new Promise(
      function (_path, resolve, reject) {
        const filePath = path.resolve(jsonDirectory, _path, "full.json");
        try {
          assertWithinBase(filePath, jsonDirectory);
        } catch (e) {
          resolve("");
          return;
        }
        fs.readFile(filePath, "utf8", function (err, data) {
          if (err || !data) {
            resolve("");
          } else {
            resolve(data);
          }
        });
      }.bind(this, _path)
    );
  });

  Promise.all(promises).then(function (results) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.write("[");
    results.forEach(function (content) {
      res.write(content);
    });
    res.write("{}]");
    res.end();
  });
}
