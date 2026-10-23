const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const JSZip = require('jszip');
const {
  ArchiveError,
  readStoredManifest,
  storeUnpackedArchive,
  unpackJsPsychArchive,
} = require('./jspsychArchive');
const {
  JSPSYCH_VERSION,
  PLUGINS,
  describeEnvelope,
} = require('./jspsychEnvelope');
const { verifyAssetToken } = require('./assetToken');
const {
  createEnvelopeFileHandler,
  createTaskFileHandler,
} = require('./taskAssetHandler');
const { jsPsychShimSource } = require('./jspsychShim');
// eslint-disable-next-line import/no-relative-packages
const { signAssetToken } = require('../../../keystone/lib/runtime/runtimeCore');

const ENTRY = `<!doctype html>
<html><head><title>RT</title><script src="js/task.js"></script></head>
<body></body></html>`;
const TASK_JS = `const jsPsych = initJsPsych({});
jsPsych.run([{ type: jsPsychHtmlKeyboardResponse, stimulus: "+" }]);`;

async function zipOf(files) {
  const zip = new JSZip();
  for (const [name, content] of Object.entries(files)) zip.file(name, content);
  return zip.generateAsync({ type: 'nodebuffer' });
}

async function problemsOf(files, options) {
  try {
    await unpackJsPsychArchive(await zipOf(files), options);
  } catch (error) {
    assert.ok(error instanceof ArchiveError, error.message);
    return error.problems;
  }
  return [];
}

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'mh-jspsych-'));
}

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

test('the envelope matches the installed jsPsych and plugins', () => {
  const modules = path.resolve(__dirname, '../../node_modules');
  const version = (dir) =>
    JSON.parse(fs.readFileSync(path.join(modules, dir, 'package.json')))
      .version;
  assert.equal(version('jspsych'), JSPSYCH_VERSION);
  for (const [name, plugin] of Object.entries(PLUGINS)) {
    assert.equal(version(`@jspsych/plugin-${name}`), plugin.version, name);
  }
  const pinned = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../package.json'))
  ).dependencies;
  assert.equal(pinned.jspsych, JSPSYCH_VERSION);
  assert.equal(describeEnvelope().plugins.length, Object.keys(PLUGINS).length);
});

test('an archive is unpacked from its folder with the plugins it uses', async () => {
  const { files, manifest } = await unpackJsPsychArchive(
    await zipOf({
      'my-task/index.html': ENTRY,
      'my-task/js/task.js': TASK_JS,
      'my-task/js/instructions.js': 'const x = jsPsychSurveyText;',
      'my-task/img/cross.png': Buffer.from([137, 80, 78, 71]),
      '__MACOSX/my-task/._index.html': 'junk',
    })
  );
  assert.deepEqual(manifest.files, [
    'img/cross.png',
    'index.html',
    'js/instructions.js',
    'js/task.js',
  ]);
  assert.equal(manifest.entryPoint, 'index.html');
  assert.equal(manifest.jsPsychVersion, JSPSYCH_VERSION);
  assert.deepEqual(manifest.plugins, ['html-keyboard-response', 'survey-text']);
  assert.equal(files.length, 4);
});

test('archives that bring their own jsPsych or leave the envelope are refused', async () => {
  const base = { 'index.html': ENTRY, 'js/task.js': TASK_JS };
  const bundled = await problemsOf({ ...base, 'lib/jspsych.js': 'x' });
  assert.match(bundled[0], /lib\/jspsych\.js looks like a copy of jsPsych/);
  const plugin = await problemsOf({
    ...base,
    'lib/plugin-html-keyboard-response.js': 'x',
  });
  assert.match(plugin[0], /looks like a copy/);
  const cdn = await problemsOf({
    ...base,
    'index.html': ENTRY.replace(
      '<title>',
      '<script src="https://unpkg.com/jspsych@7.3.4"></script><title>'
    ),
  });
  assert.match(cdn[0], /loads jsPsych from a CDN/);
  const bundle = await problemsOf({
    ...base,
    'js/task.js': `${TASK_JS}\nclass JsPsych {}`,
  });
  assert.match(bundle[0], /bundles its own jsPsych/);
  const camera = await problemsOf({
    ...base,
    'js/task.js': `${TASK_JS}\nconst c = jsPsychInitializeCamera;`,
  });
  assert.match(camera[0], /plugin-initialize-camera.*no camera/);
  assert.match(
    (await problemsOf({ 'start.html': ENTRY }))[0],
    /HTML entry point at index\.html/
  );
  assert.deepEqual(
    await problemsOf({ 'start.html': ENTRY }, { entryPoint: 'start.html' }),
    []
  );
  await assert.rejects(
    unpackJsPsychArchive(Buffer.from('not a zip')),
    /readable zip/
  );
});

test('a version is stored once and never rewritten', async () => {
  const root = tempDir();
  const unpacked = await unpackJsPsychArchive(
    await zipOf({ 'index.html': ENTRY, 'js/task.js': TASK_JS })
  );
  await storeUnpackedArchive(root, 'version7', unpacked);
  assert.equal(
    fs.readFileSync(
      path.join(root, 'version7', 'files', 'js', 'task.js'),
      'utf8'
    ),
    TASK_JS
  );
  assert.deepEqual(
    (await readStoredManifest(root, 'version7')).files,
    unpacked.manifest.files
  );
  await assert.rejects(
    storeUnpackedArchive(root, 'version7', unpacked),
    /already stored/
  );
  await assert.rejects(
    readStoredManifest(root, '../etc'),
    /Invalid jsPsych version id/
  );
  assert.deepEqual(fs.readdirSync(root), ['version7']);
});

async function serveTask() {
  const root = tempDir();
  await storeUnpackedArchive(
    root,
    'version7',
    await unpackJsPsychArchive(
      await zipOf({ 'index.html': ENTRY, 'js/task.js': TASK_JS })
    )
  );
  const handler = createTaskFileHandler({
    assetRoot: root,
    verifyAssetToken: (value) => verifyAssetToken(value, 'secret'),
    readManifest: readStoredManifest,
  });
  const token = signAssetToken('version7', 'secret');
  const get = async (file, query = {}, tokenValue = token) => {
    const res = fakeResponse();
    await handler(
      {
        method: 'GET',
        headers: { host: 'mindhive.test', 'x-forwarded-proto': 'https' },
        query: { token: tokenValue, path: file.split('/'), ...query },
      },
      res
    );
    return res;
  };
  return { get };
}

test('the entry point gets the runtime before the experiment, under the task policy', async () => {
  const { get } = await serveTask();
  const res = await get('index.html', { n: 'nonce-12345' });
  assert.equal(res.statusCode, 200);
  const html = String(res.body);
  const order = [
    html.indexOf('mindhive-runtime/2'),
    html.indexOf('/api/runtime/jspsych/jspsych.css'),
    html.indexOf('/api/runtime/jspsych/jspsych.js'),
    html.indexOf('/api/runtime/jspsych/plugin-html-keyboard-response.js'),
    html.indexOf('window.initJsPsych = function'),
    html.indexOf('js/task.js'),
  ];
  assert.ok(
    order.every((at) => at >= 0),
    String(order)
  );
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order
  );
  assert.match(html, /"nonce-12345"/);
  assert.equal(res.headers['cache-control'], 'no-store');
  assert.equal(res.headers['access-control-allow-origin'], '*');
  assert.equal(res.headers['cross-origin-resource-policy'], 'cross-origin');
  const csp = res.headers['content-security-policy'];
  assert.match(csp, /^sandbox allow-scripts allow-forms;/);
  assert.match(csp, /frame-ancestors 'self' https:\/\/mindhive\.test/);
  assert.match(csp, /default-src \*/);
});

test('task files are served only from the manifest, with a valid token', async () => {
  const { get } = await serveTask();
  const script = await get('js/task.js');
  assert.equal(script.statusCode, 200);
  assert.equal(String(script.body), TASK_JS);
  assert.match(script.headers['content-type'], /javascript/);
  assert.match(script.headers['content-security-policy'], /^sandbox/);
  assert.equal((await get('index.html')).statusCode, 400);
  assert.equal((await get('js/other.js')).statusCode, 404);
  assert.equal((await get('../manifest.json')).statusCode, 400);
  assert.equal((await get('js/task.js', {}, 'forged.token')).statusCode, 403);
  assert.equal(
    (await get('js/task.js', {}, signAssetToken('version8', 'secret')))
      .statusCode,
    404
  );
});

test('the pinned jsPsych files are served from node_modules', async () => {
  const handler = createEnvelopeFileHandler({
    modulesRoot: path.resolve(__dirname, '../../node_modules'),
  });
  const get = async (file) => {
    const res = fakeResponse();
    await handler({ method: 'GET', query: { file } }, res);
    return res;
  };
  const core = await get('jspsych.js');
  assert.equal(core.statusCode, 200);
  assert.match(String(core.body), /initJsPsych/);
  assert.match(core.headers['cache-control'], /immutable/);
  assert.equal((await get('plugin-survey.css')).statusCode, 200);
  assert.equal((await get('plugin-html-keyboard-response.js')).statusCode, 200);
  assert.equal((await get('plugin-initialize-camera.js')).statusCode, 404);
  assert.equal((await get('../package.json')).statusCode, 404);
});

// A stand-in for jsPsych's public surface, enough to drive the shim.
const FAKE_JSPSYCH = `
window.initJsPsych = function (options) {
  var rows = [];
  return {
    getProgress: function () { return { current_trial_global: rows.length }; },
    run: function (timeline) {
      timeline.forEach(function (trial, i) {
        options.on_trial_start({ type: { info: { name: "html-keyboard-response" } } });
        var data = { trial_index: i, trial_type: "html-keyboard-response", rt: 100 + i };
        rows.push(data);
        options.on_data_update(data);
        options.on_trial_finish(data);
      });
      return Promise.resolve(options.on_finish({ values: function () { return rows.slice(); } }));
    },
  };
};`;

function runShim(experiment) {
  const calls = [];
  let init = null;
  const events = new EventTarget();
  const context = vm.createContext({
    addEventListener: (type, fn) => events.addEventListener(type, fn),
    Promise,
    MindHive: null,
  });
  context.window = context;
  context.MindHive = {
    params: {},
    ready: () => calls.push(['ready']),
    saveRow: (row) => calls.push(['row', JSON.parse(JSON.stringify(row))]),
    marker: (label, value) =>
      calls.push(['marker', label, JSON.parse(JSON.stringify(value))]),
    finish: (aggregated, rows) =>
      calls.push([
        'finish',
        JSON.parse(JSON.stringify(aggregated)),
        JSON.parse(JSON.stringify(rows)),
      ]),
    fail: (message) => calls.push(['fail', message]),
    onInit: (callback) => {
      init = callback;
    },
  };
  vm.runInContext(FAKE_JSPSYCH, context);
  vm.runInContext(jsPsychShimSource(), context);
  vm.runInContext(experiment, context);
  return {
    calls,
    context,
    sendInit(params) {
      Object.assign(context.MindHive.params, params);
      init(context.MindHive);
    },
  };
}

test('the shim saves rows and markers, waits for init, and finishes with the aggregate', async () => {
  const shim = runShim(`
    window.ownRows = 0;
    var jsPsych = initJsPsych({
      on_data_update: function () { window.ownRows += 1; },
      on_finish: function (data) { return { mean_rt: 100.5, n: data.values().length }; },
    });
    window.done = jsPsych.run([{}, {}]);`);
  assert.deepEqual(shim.calls, [['ready']]);
  shim.sendInit({ trials: 2 });
  await shim.context.done;
  assert.deepEqual(shim.calls.slice(1, 4), [
    [
      'marker',
      'trial_start',
      { trial_type: 'html-keyboard-response', trial_index: 0 },
    ],
    ['row', { trial_index: 0, trial_type: 'html-keyboard-response', rt: 100 }],
    [
      'marker',
      'trial_end',
      { trial_type: 'html-keyboard-response', trial_index: 0 },
    ],
  ]);
  assert.deepEqual(shim.calls.at(-1), [
    'finish',
    { mean_rt: 100.5, n: 2 },
    [
      { trial_index: 0, trial_type: 'html-keyboard-response', rt: 100 },
      { trial_index: 1, trial_type: 'html-keyboard-response', rt: 101 },
    ],
  ]);
  assert.equal(shim.context.ownRows, 2);
});

test('an experiment without on_finish finishes with an empty aggregate', async () => {
  const shim = runShim('window.done = initJsPsych().run([{}]);');
  shim.sendInit({});
  await shim.context.done;
  assert.deepEqual(shim.calls.at(-1)[1], {});
  assert.equal(shim.calls.at(-1)[2].length, 1);
});
