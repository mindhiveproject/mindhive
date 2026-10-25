// The one p5 release MindHive runs, in the visual builder (from the CDN) and
// in study tasks (pinned in frontend/package.json, served by /api/runtime/p5).
// p5Task.test.js fails if package.json disagrees.
const P5_VERSION = '2.3.4';

module.exports = { P5_VERSION };
