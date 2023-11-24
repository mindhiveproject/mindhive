import path from "path";
const fs = require("fs");

export default async function handler(req, res) {
  const { fileDirs } = req.body;

  // Find the absolute path of the json directory
  const jsonDirectory = path.join(process.cwd(), "data");

  const promises = fileDirs.map(function (_path) {
    return new Promise(
      function (_path, resolve, reject) {
        fs.readFile(
          jsonDirectory + "/" + _path + "/full.json",
          "utf8",
          function (err, data) {
            if (err || !data) {
              resolve("");
            } else {
              resolve(data);
            }
          }
        );
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
