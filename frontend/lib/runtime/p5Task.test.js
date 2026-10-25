const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {
  P5_VERSION,
  buildP5TaskDocument,
  p5TaskPreludeSource,
  p5TaskStartSource,
} = require('./p5TaskDocument');
const {
  createEnvelopeFileHandler,
  createTaskFileHandler,
  createVisualTaskHandler,
  p5File,
} = require('./taskAssetHandler');
const { verifyAssetToken } = require('./assetToken');
// eslint-disable-next-line import/no-relative-packages
const { signAssetToken } = require('../../../keystone/lib/runtime/runtimeCore');

const FILES = [
  {
    name: 'sketch.js',
    role: 'entry',
    language: 'javascript',
    content:
      'function setup() { window.setupSize = params.size; }\nfunction draw() {}\n// "</script>" in a comment',
  },
  {
    name: 'parameters.js',
    role: 'parameters',
    language: 'javascript',
    content: 'declareParameters({ size: { type: "number", default: 0.5 } });',
  },
  {
    name: 'shader.frag',
    role: 'module',
    language: 'glsl',
    content: 'void main() {}',
  },
];

function fakeResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    send(value) {
      this.body = value;
      return this;
    },
    end() {
      return this;
    },
  };
}

test('the p5 task document loads the pinned p5 and the sketch in order', () => {
  const html = buildP5TaskDocument(FILES, 'nonce-12345');
  const at = (text) => html.indexOf(text);
  assert.ok(
    at('mindhive-runtime/2') < at(`/api/runtime/p5/p5.js?v=${P5_VERSION}`)
  );
  assert.ok(at('declareParameters({ size') < at('window["shader"]'));
  assert.ok(at('window["shader"]') < at('function setup()'));
  assert.ok(at('function setup()') < at('new window.p5()'));
  assert.doesNotMatch(html, /cdn\.jsdelivr/);
  // The sketch's own "</script>" can't close its tag early.
  assert.match(html, /"<\\\/script>" in a comment/);
  assert.match(html, /"nonce-12345"/);
});

function runSketch(code) {
  const calls = [];
  let init = null;
  const context = vm.createContext({});
  context.window = context;
  context.MindHive = {
    params: {},
    marker: (label, value) =>
      calls.push(['marker', label, JSON.parse(JSON.stringify(value ?? null))]),
    fail: (message) => calls.push(['fail', message]),
    ready: () => calls.push(['ready']),
    onInit: (callback) => {
      init = callback;
    },
  };
  // Stands in for p5's global mode: it runs setup and one draw.
  context.p5 = function p5() {
    calls.push(['p5 started']);
    if (typeof context.setup === 'function') context.setup();
    if (typeof context.draw === 'function') context.draw();
  };
  context.noLoop = () => calls.push(['noLoop']);
  vm.runInContext(p5TaskPreludeSource(), context);
  vm.runInContext(code, context);
  vm.runInContext(p5TaskStartSource(), context);
  return {
    calls,
    context,
    sendInit(params) {
      Object.assign(context.MindHive.params, params);
      init(context.MindHive);
    },
  };
}

test('p5 waits for init, so setup sees the task parameters', () => {
  const sketch = runSketch(`
    declareParameters({ size: { default: 0.5 }, label: { default: "a" } });
    function setup() { window.seen = { size: params.size, label: data.label }; sendEvent("onset", { n: 1 }); }
    function draw() {}`);
  assert.equal(typeof sketch.context.setup, 'undefined');
  assert.deepEqual(sketch.calls, []);
  sketch.sendInit({ size: 0.9 });
  assert.deepEqual(JSON.parse(JSON.stringify(sketch.context.seen)), {
    size: 0.9,
    label: 'a',
  });
  assert.deepEqual(sketch.calls, [
    ['p5 started'],
    ['marker', 'onset', { n: 1 }],
    ['ready'],
  ]);
});

test('an error in setup or draw ends the run as a failure', () => {
  const sketch = runSketch(
    'function setup() {}\nfunction draw() { undefinedThing.x = 1; }'
  );
  sketch.sendInit({});
  assert.deepEqual(sketch.calls.slice(0, 3), [
    ['p5 started'],
    ['fail', 'draw: undefinedThing is not defined'],
    ['noLoop'],
  ]);
});

test('an async setup that rejects ends the run as a failure (p5 2.x)', async () => {
  const sketch = runSketch(
    'async function setup() { await Promise.resolve(); throw new Error("asset missing"); }'
  );
  sketch.sendInit({});
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  assert.deepEqual(sketch.calls.slice(0, 3), [
    ['p5 started'],
    ['ready'],
    ['fail', 'setup: asset missing'],
  ]);
});

test('preload is not held: p5 2.x has none', () => {
  const sketch = runSketch('function preload() {}\nfunction draw() {}');
  assert.equal(typeof sketch.context.preload, 'function');
  assert.equal(typeof sketch.context.draw, 'undefined');
});

test('a sketch without setup or draw never starts p5', () => {
  const sketch = runSketch('var nothing = 1;');
  assert.deepEqual(sketch.calls, []);
});

function visualHandler(loadVisualFiles = async () => FILES) {
  return createVisualTaskHandler({
    verifyAssetToken: (token) => verifyAssetToken(token, 'secret'),
    loadVisualFiles,
    buildDocument: buildP5TaskDocument,
  });
}

async function get(handler, query) {
  const res = fakeResponse();
  await handler(
    { method: 'GET', headers: { host: 'mindhive.test' }, query },
    res
  );
  return res;
}

test('the visual route builds the task document for a p5 token only', async () => {
  const p5Token = signAssetToken('visual-1', 'secret', Date.now(), 'P5');
  const res = await get(visualHandler(), { token: p5Token, n: 'nonce-12345' });
  assert.equal(res.statusCode, 200);
  assert.match(String(res.body), /function setup\(\)/);
  assert.equal(res.headers['cache-control'], 'no-store');
  assert.match(
    res.headers['content-security-policy'],
    /^sandbox allow-scripts allow-forms;/
  );
  assert.equal(res.headers['cross-origin-resource-policy'], 'cross-origin');

  const jsPsychToken = signAssetToken(
    'version-1',
    'secret',
    Date.now(),
    'JSPSYCH'
  );
  assert.equal(
    (await get(visualHandler(), { token: jsPsychToken, n: 'nonce-12345' }))
      .statusCode,
    403
  );
  assert.equal(
    (await get(visualHandler(), { token: 'forged.token', n: 'nonce-12345' }))
      .statusCode,
    403
  );
  assert.equal(
    (await get(visualHandler(), { token: p5Token })).statusCode,
    400
  );
  const unavailable = visualHandler(async () => {
    throw new Error('Not a p5 asset token');
  });
  assert.equal(
    (await get(unavailable, { token: p5Token, n: 'nonce-12345' })).statusCode,
    404
  );
  const noEntry = visualHandler(async () =>
    FILES.filter((f) => f.role !== 'entry')
  );
  assert.equal(
    (await get(noEntry, { token: p5Token, n: 'nonce-12345' })).statusCode,
    404
  );
});

test('the jsPsych task route refuses a p5 token', async () => {
  const handler = createTaskFileHandler({
    assetRoot: '/nonexistent',
    verifyAssetToken: (value) => verifyAssetToken(value, 'secret'),
    readManifest: async () => {
      throw new Error('not reached');
    },
  });
  const p5Token = signAssetToken('visual-1', 'secret', Date.now(), 'P5');
  const res = await get(handler, {
    token: p5Token,
    path: ['index.html'],
    n: 'nonce-12345',
  });
  assert.equal(res.statusCode, 403);
});

test('the pinned p5 is served from node_modules', async () => {
  const handler = createEnvelopeFileHandler({
    modulesRoot: path.resolve(__dirname, '../../node_modules'),
    resolveFile: p5File,
  });
  const p5 = fakeResponse();
  await handler({ method: 'GET', query: { file: 'p5.js' } }, p5);
  assert.equal(p5.statusCode, 200);
  assert.ok(String(p5.body).slice(0, 200).includes(`"${P5_VERSION}"`));
  const other = fakeResponse();
  await handler({ method: 'GET', query: { file: 'jspsych.js' } }, other);
  assert.equal(other.statusCode, 404);
  const pinned = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../package.json'))
  ).dependencies.p5;
  assert.equal(pinned, P5_VERSION);
});
