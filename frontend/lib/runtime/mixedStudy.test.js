// W24: a study with a Lab.js block and a jsPsych block, through the real
// pieces end to end, minus the browser. The jsPsych block is uploaded, its
// page is served with the runtime injected, the injected scripts run in a
// separate realm wired to the parent over a real MessageChannel, and the
// results go through the run buffer, the save client and /api/runtime/save
// to full.json and FINAL/COMPLETE. The Lab.js block saves through the same
// store /api/save uses. Only jsPsych itself is a stand-in.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { Readable } = require('node:stream');
const JSZip = require('jszip');
const { PostMessageTransport } = require('yq-data');

const { createJsPsychUploadHandler } = require('./jspsychUploadHandler');
const { readStoredManifest } = require('./jspsychArchive');
const { createTaskFileHandler } = require('./taskAssetHandler');
const { verifyAssetToken } = require('./assetToken');
const { createRuntimeSaveHandler } = require('./runtimeSaveHandler');
const {
  INGEST_COMPLETE_MUTATION,
  INGEST_FINAL_MUTATION,
  RUN_CONTEXT_QUERY,
  ingestFinalAndComplete,
  runDirectory,
  writeRawResult,
} = require('./runResultStore');
const {
  labJsGraphqlFinalPayload,
  stampLabJsMetadata,
} = require('./labJsCompatibility');
const {
  createRuntimeFrameConnection,
} = require('../../components/Tasks/Run/runtimeFrameConnection');
const { createRunBuffer } = require('../../components/Tasks/Run/runBuffer');
const {
  createRuntimeSaveClient,
} = require('../../components/Tasks/Run/runtimeSaveClient');
// eslint-disable-next-line import/no-relative-packages
const { signAssetToken } = require('../../../keystone/lib/runtime/runtimeCore');

const SECRET = 'pipeline-secret';
const SAFE_SEGMENT_RE = /^[a-zA-Z0-9][a-zA-Z0-9_\-.]{0,253}$/;
const pathGuards = {
  validatePathSegment(value, label) {
    if (typeof value !== 'string' || !SAFE_SEGMENT_RE.test(value)) {
      throw new Error(`Invalid ${label}`);
    }
  },
  assertWithinBase(resolved, base) {
    if (!resolved.startsWith(base + path.sep)) throw new Error('traversal');
  },
};

const TASK_JS = `
var jsPsych = initJsPsych({
  on_finish: function (data) {
    return { trials: data.values().length, chosen: MindHive.params.hand };
  },
});
MindHive.onInit(function () {
  var timeline = [];
  for (var i = 0; i < MindHive.params.trials; i += 1) {
    timeline.push({ type: jsPsychHtmlKeyboardResponse, stimulus: "+" });
  }
  jsPsych.run(timeline);
});`;

// jsPsych's public surface, enough to run a timeline synchronously.
const FAKE_JSPSYCH = `
window.initJsPsych = function (options) {
  var rows = [];
  return {
    getProgress: function () { return { current_trial_global: rows.length }; },
    run: function (timeline) {
      timeline.forEach(function (trial, i) {
        options.on_trial_start({ type: { info: { name: "html-keyboard-response" } } });
        var data = { trial_index: i, trial_type: "html-keyboard-response", rt: 200 + i, response: { key: "f" } };
        rows.push(data);
        options.on_data_update(data);
        options.on_trial_finish(data);
      });
      return Promise.resolve(options.on_finish({ values: function () { return rows.slice(); } }));
    },
  };
};`;

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

async function waitFor(predicate, timeoutMs = 2000) {
  const started = Date.now();
  while (!(await predicate())) {
    if (Date.now() - started > timeoutMs) throw new Error('Timed out waiting');
    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });
  }
}

function readAsCollectDoes(file) {
  return JSON.parse(`[${fs.readFileSync(file, 'utf8')}{}]`).slice(0, -1);
}

// A sandboxed frame: its own realm, window messages structured-cloned, and
// the scripts of the served page run in document order.
function createFrame(host) {
  const events = new EventTarget();
  const messageListeners = [];
  const intervals = [];
  const frameWindow = {
    postMessage(data, origin, transfer = []) {
      messageListeners.forEach((fn) =>
        fn({
          data: structuredClone(data),
          source: parentWindow,
          ports: transfer,
        })
      );
    },
  };
  const parentWindow = {
    postMessage(data) {
      host.emit({ data: structuredClone(data), source: frameWindow });
    },
  };
  const context = vm.createContext({
    addEventListener(type, fn) {
      if (type === 'message') messageListeners.push(fn);
      else events.addEventListener(type, fn);
    },
    dispatchEvent: (event) => events.dispatchEvent(event),
    parent: parentWindow,
    console: { log() {}, info() {}, warn() {}, error() {} },
    setInterval(fn, ms) {
      const id = setInterval(fn, ms);
      intervals.push(id);
      return id;
    },
    clearInterval,
    CustomEvent,
    Promise,
  });
  context.window = context;
  return {
    frameWindow,
    run: (code) => vm.runInContext(code, context),
    stop: () => intervals.forEach(clearInterval),
  };
}

test('a study with a Lab.js block and a jsPsych block saves both runs', async () => {
  const assetRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-mixed-assets-'));
  const dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-mixed-data-'));
  const ingests = [];

  // --- Block 1: Lab.js, saved through the store /api/save uses.
  const labJsRun = {
    datasetToken: 'labjs-dataset',
    date: '2026-10-23',
    runtimeType: 'LABJS',
    assetId: 'template-1',
    assetVersion: '1',
    studyId: 'study-1',
    taskId: 'labjs-task',
    templateId: 'template-1',
    participantType: 'GUEST',
    participantPublicId: 'guest-1',
  };
  const labJsRows = [
    { sender: 'Trial', response: 'left' },
    { sender: 'Task', aggregated: { accuracy: 1 } },
  ];
  const labJsDir = runDirectory({
    dataRoot,
    runContext: labJsRun,
    ...pathGuards,
  });
  await writeRawResult({
    dir: labJsDir,
    payload: 'full',
    body: {
      metadata: stampLabJsMetadata(labJsRun, { payload: 'full' }),
      data: labJsRows,
    },
  });
  await ingestFinalAndComplete(
    async (query, variables) =>
      ingests.push({ run: 'labjs', query, variables }),
    'labjs-run-token',
    labJsGraphqlFinalPayload(labJsRows)
  );

  // --- Block 2: jsPsych, uploaded by a TESTER.
  const zip = new JSZip();
  zip.file(
    'rt/index.html',
    '<!doctype html><html><head><script src="js/task.js"></script></head><body></body></html>'
  );
  zip.file('rt/js/task.js', TASK_JS);
  zip.file(
    'rt/mindhive.json',
    JSON.stringify({
      parameters: [
        { name: 'trials', type: 'number', value: 3 },
        {
          name: 'hand',
          type: 'select',
          value: 'left',
          options: ['left', 'right'],
        },
      ],
    })
  );
  const upload = createJsPsychUploadHandler({
    assetRoot,
    graphql: async () => ({
      authenticatedItem: { id: 'tester', permissions: [{ name: 'TESTER' }] },
    }),
    createVersion: async () => ({ id: 'version1', family: '' }),
  });
  const uploadReq = Object.assign(
    Readable.from([await zip.generateAsync({ type: 'nodebuffer' })]),
    { method: 'POST', query: { title: 'RT' }, headers: { cookie: 'c' } }
  );
  const uploaded = fakeResponse();
  await upload(uploadReq, uploaded);
  assert.equal(uploaded.statusCode, 201, JSON.stringify(uploaded.body));
  assert.deepEqual(uploaded.body.plugins, ['html-keyboard-response']);

  // The task route serves the entry page with the runtime injected.
  const taskRoute = createTaskFileHandler({
    assetRoot,
    verifyAssetToken: (token) => verifyAssetToken(token, SECRET),
    readManifest: readStoredManifest,
  });
  const assetToken = signAssetToken('version1', SECRET, Date.now(), 'JSPSYCH');
  const nonce = 'pipeline-nonce-1';
  const get = async (file, query = {}) => {
    const res = fakeResponse();
    await taskRoute(
      {
        method: 'GET',
        headers: { host: 'mindhive.test' },
        query: { token: assetToken, path: file.split('/'), ...query },
      },
      res
    );
    assert.equal(res.statusCode, 200, `${file}: ${JSON.stringify(res.body)}`);
    return String(res.body);
  };
  const page = await get('index.html', { n: nonce });

  // The save route, reached through the real save client.
  const jsPsychRun = {
    ...labJsRun,
    datasetToken: 'jspsych-dataset',
    runtimeType: 'JSPSYCH',
    assetId: 'version1',
    assetVersion: 'version1',
    taskId: 'jspsych-task',
    templateId: null,
  };
  const saveRoute = createRuntimeSaveHandler({
    dataRoot,
    ...pathGuards,
    graphql: async (query, variables) => {
      if (query === RUN_CONTEXT_QUERY) return { runtimeRunContext: jsPsychRun };
      ingests.push({ run: 'jspsych', query, variables });
      return {};
    },
  });
  const client = createRuntimeSaveClient({
    runToken: 'jspsych-run-token',
    sendBeacon: () => false,
    fetchImpl: async (url, init) => {
      const res = fakeResponse();
      const runToken = new URL(url, 'http://x').searchParams.get('runToken');
      await saveRoute(
        { method: 'POST', query: { runToken }, body: JSON.parse(init.body) },
        res
      );
      return {
        ok: res.statusCode < 300,
        status: res.statusCode,
        json: async () => res.body,
      };
    },
  });
  const buffer = createRunBuffer({ save: client.save, beacon: client.beacon });

  // The parent connects to the frame and relays into the buffer.
  const listeners = new Set();
  const host = {
    addEventListener: (type, fn) => listeners.add(fn),
    removeEventListener: (type, fn) => listeners.delete(fn),
    emit: (event) => [...listeners].forEach((fn) => fn(event)),
  };
  const frame = createFrame(host);
  let finished = null;
  const failures = [];
  const connection = createRuntimeFrameConnection({
    nonce,
    host,
    getFrameWindow: () => frame.frameWindow,
    init: {
      runtime: 'JSPSYCH',
      mode: 'persist',
      params: { trials: 2, hand: 'right' },
    },
    createTransport: async (port) =>
      new PostMessageTransport({ target: port, source: port }),
    handlers: {
      onMarker: (marker) => buffer.addMarker(marker),
      onFinish: (result) => {
        finished = buffer.finish(result);
      },
      onFailure: ({ message }) => {
        failures.push(message);
      },
      onRejected: (reason) => failures.push(`refused: ${reason}`),
      onRows: (rows) => buffer.addRows(rows),
    },
  });
  connection.start();

  try {
    // Run the page's scripts in document order, as the frame would.
    const scripts = [
      ...page.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g),
    ];
    assert.ok(scripts.length >= 4, 'frame client, jsPsych, plugin, shim, task');
    for (const [, src, inline] of scripts) {
      if (!src) frame.run(inline);
      else if (src.startsWith('/api/runtime/jspsych/jspsych.js'))
        frame.run(FAKE_JSPSYCH);
      else if (
        src.startsWith('/api/runtime/jspsych/plugin-html-keyboard-response.js')
      ) {
        frame.run(
          'window.jsPsychHtmlKeyboardResponse = { info: { name: "html-keyboard-response" } };'
        );
      } else if (src.startsWith('/api/runtime/jspsych/')) {
        throw new Error(`Unexpected pinned file ${src}`);
      } else {
        frame.run(await get(src));
      }
    }

    await waitFor(() => finished !== null);
    await finished;
    assert.deepEqual(failures, []);
  } finally {
    connection.close();
    frame.stop();
    buffer.dispose();
  }

  // --- Both runs: full.json readable the way Collect reads it, then FINAL
  // and COMPLETE for each.
  const [labJsFull] = readAsCollectDoes(path.join(labJsDir, 'full.json'));
  assert.equal(labJsFull.metadata.runtimeType, 'LABJS');
  assert.deepEqual(labJsFull.data, labJsRows);

  const jsPsychDir = runDirectory({
    dataRoot,
    runContext: jsPsychRun,
    ...pathGuards,
  });
  const [jsPsychFull] = readAsCollectDoes(path.join(jsPsychDir, 'full.json'));
  assert.equal(jsPsychFull.metadata.runtimeType, 'JSPSYCH');
  assert.equal(jsPsychFull.metadata.runtimeAssetVersion, 'version1');
  assert.deepEqual(jsPsychFull.aggregated, { trials: 2, chosen: 'right' });
  const trials = jsPsychFull.data.filter((row) => row.mh_kind !== 'marker');
  const markers = jsPsychFull.data.filter((row) => row.mh_kind === 'marker');
  assert.deepEqual(
    trials.map((row) => row.rt),
    [200, 201]
  );
  assert.deepEqual(trials[0].response, { key: 'f' });
  assert.deepEqual(
    markers.map((row) => row.label),
    ['trial_start', 'trial_end', 'trial_start', 'trial_end']
  );

  const sequence = (run) =>
    ingests.filter((entry) => entry.run === run).map((entry) => entry.query);
  assert.deepEqual(sequence('labjs'), [
    INGEST_FINAL_MUTATION,
    INGEST_COMPLETE_MUTATION,
  ]);
  assert.deepEqual(sequence('jspsych'), [
    INGEST_FINAL_MUTATION,
    INGEST_COMPLETE_MUTATION,
  ]);
  const jsPsychFinal = ingests.find(
    (entry) => entry.run === 'jspsych' && entry.query === INGEST_FINAL_MUTATION
  );
  assert.deepEqual(jsPsychFinal.variables.aggregated, {
    trials: 2,
    chosen: 'right',
  });
});
