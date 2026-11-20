// Run with: node --test lib/api/rateLimit.test.js
// rateLimit.ts is TypeScript and Node 20 cannot load it directly, so it is
// transpiled in memory with the project's own typescript package.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");

function loadRateLimit() {
  const file = path.join(__dirname, "rateLimit.ts");
  const { outputText } = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  });
  const m = new Module(file);
  m.filename = file;
  m._compile(outputText, file);
  return m.exports;
}

const { saveDataLimiter, createRateLimiter } = loadRateLimit();

function fakeReq(ip) {
  return { headers: { "x-forwarded-for": ip }, socket: {} };
}
function fakeRes() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };
}

function hit(limiter, ip, times) {
  let firstRejected = null;
  for (let i = 1; i <= times; i++) {
    if (!limiter(fakeReq(ip), fakeRes()) && firstRejected === null) firstRejected = i;
  }
  return firstRejected;
}

test("one classroom IP can make 3000 saves in a window (the 2026-09-02 data loss started at 301)", () => {
  assert.equal(hit(saveDataLimiter, "10.0.0.1", 3000), null);
});

test("save 3001 from the same IP in the window is rejected with 429", () => {
  const ip = "10.0.0.2";
  hit(saveDataLimiter, ip, 3000);
  const res = fakeRes();
  assert.equal(saveDataLimiter(fakeReq(ip), res), false);
  assert.equal(res.statusCode, 429);
});

test("other IPs keep their own count", () => {
  hit(saveDataLimiter, "10.0.0.3", 3001);
  assert.equal(saveDataLimiter(fakeReq("10.0.0.4"), fakeRes()), true);
});

test("the count resets after the window", (t) => {
  t.mock.timers.enable({ apis: ["Date"] });
  const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
  assert.equal(hit(limiter, "ip", 3), 3);
  t.mock.timers.tick(1001);
  assert.equal(limiter(fakeReq("ip"), fakeRes()), true);
});
