const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRuntimeSaveHandler } = require('./runtimeSaveHandler');
const {
  INGEST_COMPLETE_MUTATION,
  INGEST_FINAL_MUTATION,
  RUN_CONTEXT_QUERY,
} = require('./runResultStore');
const {
  createRuntimeSaveClient,
} = require('../../components/Tasks/Run/runtimeSaveClient');

// The same rules as lib/api/paths.ts, which the routes pass in.
const SAFE_SEGMENT_RE = /^[a-zA-Z0-9][a-zA-Z0-9_\-.]{0,253}$/;
function validatePathSegment(value, label) {
  if (typeof value !== 'string' || !SAFE_SEGMENT_RE.test(value)) {
    throw new Error(`Invalid ${label}: "${value}"`);
  }
}
function assertWithinBase(resolvedPath, basePath) {
  if (!resolvedPath.startsWith(basePath + path.sep)) {
    throw new Error('Path traversal detected');
  }
}

const RUN = {
  datasetToken: 'dataset-token-1',
  date: '2026-10-21',
  runtimeType: 'JSPSYCH',
  testVersion: null,
  studyVersion: 'v3',
  assetId: 'version-row-7',
  assetVersion: 'version-row-7',
  participantType: 'GUEST',
  participantPublicId: 'guest-1',
  studyId: 'study-1',
  taskId: 'task-1',
  templateId: null,
};

function setup({ run = RUN, failIngest = false } = {}) {
  const dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-runtime-save-'));
  const calls = [];
  const graphql = async (query, variables) => {
    calls.push({ query, variables });
    if (query === RUN_CONTEXT_QUERY) {
      if (variables.runToken !== 'good-token') throw new Error('Invalid token');
      return { runtimeRunContext: run };
    }
    if (failIngest) throw new Error('Expected sequence 3');
    return { ingestRunMessage: { accepted: true } };
  };
  const handler = createRuntimeSaveHandler({
    graphql,
    dataRoot,
    validatePathSegment,
    assertWithinBase,
  });
  const runDir = path.join(dataRoot, '2026', '10', '21', 'dataset-token-1');
  return { handler, calls, runDir, dataRoot };
}

async function post(handler, body, runToken = 'good-token') {
  const res = {
    statusCode: 200,
    body: undefined,
    setHeader() {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    end() {
      return this;
    },
  };
  await handler({ method: 'POST', query: { runToken }, body }, res);
  return res;
}

// How Collect's readers join raw files (see pages/api/download/rawfiles.js).
function readAsCollectDoes(file) {
  return JSON.parse(`[${fs.readFileSync(file, 'utf8')}{}]`).slice(0, -1);
}

test('incremental batches append to incremental.json in the Lab.js layout', async () => {
  const { handler, runDir } = setup();
  await post(handler, { kind: 'incremental', rows: [{ trial: 1 }] });
  await post(handler, { kind: 'incremental', rows: [{ trial: 2 }] });
  const raw = fs.readFileSync(path.join(runDir, 'incremental.json'), 'utf8');
  const entries = readAsCollectDoes(path.join(runDir, 'incremental.json'));
  assert.equal(
    raw,
    entries.map((entry) => `${JSON.stringify(entry)},\n`).join('')
  );
  assert.deepEqual(
    entries.map((entry) => entry.data),
    [[{ trial: 1 }], [{ trial: 2 }]]
  );
  assert.deepEqual(entries[0].metadata, {
    payload: 'incremental',
    id: 'dataset-token-1',
    runtimeType: 'JSPSYCH',
    runtimeAssetId: 'version-row-7',
    runtimeAssetVersion: 'version-row-7',
    testVersion: null,
    studyVersion: 'v3',
    study: 'study-1',
    template: null,
    task: 'task-1',
    type: 'GUEST',
    publicId: 'guest-1',
  });
});

test('full writes full.json once, then sends FINAL and COMPLETE', async () => {
  const { handler, calls, runDir } = setup();
  const rows = [
    { trial: 1, rt: 300 },
    { mh_kind: 'marker', label: 'onset', value: null, time: 7 },
  ];
  const res = await post(handler, {
    kind: 'full',
    rows,
    aggregated: { score: 1 },
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { saved: true, kind: 'full', duplicate: false });
  const [stored] = readAsCollectDoes(path.join(runDir, 'full.json'));
  assert.deepEqual(stored.data, rows);
  assert.deepEqual(stored.aggregated, { score: 1 });
  const ingests = calls.filter((call) => call.query !== RUN_CONTEXT_QUERY);
  assert.deepEqual(
    ingests.map((call) => call.query),
    [INGEST_FINAL_MUTATION, INGEST_COMPLETE_MUTATION]
  );
  assert.deepEqual(ingests[0].variables, {
    runToken: 'good-token',
    data: rows,
    aggregated: { score: 1 },
  });

  const retry = await post(handler, { kind: 'full', rows: [{ other: true }] });
  assert.equal(retry.body.duplicate, true);
  assert.deepEqual(
    readAsCollectDoes(path.join(runDir, 'full.json'))[0].data,
    rows
  );
});

test('a failed ingest is reported so the runner retries', async () => {
  const { handler } = setup({ failIngest: true });
  const res = await post(handler, { kind: 'full', rows: [] });
  assert.equal(res.statusCode, 409);
  assert.match(res.body.error, /Expected sequence 3/);
});

test('requests without a valid token, payload or runtime are refused', async () => {
  const { handler, dataRoot } = setup();
  assert.equal(
    (await post(handler, { kind: 'full', rows: [] }, '')).statusCode,
    401
  );
  assert.equal(
    (await post(handler, { kind: 'full', rows: [] }, 'bad')).statusCode,
    401
  );
  assert.equal(
    (await post(handler, { kind: 'latest', rows: [] })).statusCode,
    400
  );
  assert.equal(
    (await post(handler, { kind: 'full', rows: [[1]] })).statusCode,
    400
  );
  assert.equal(
    (await post(handler, { kind: 'full', rows: [], aggregated: [] }))
      .statusCode,
    400
  );
  const labJs = setup({ run: { ...RUN, runtimeType: 'LABJS' } });
  assert.equal(
    (await post(labJs.handler, { kind: 'full', rows: [] })).statusCode,
    400
  );
  const unsafe = setup({ run: { ...RUN, datasetToken: '../escape' } });
  assert.equal(
    (await post(unsafe.handler, { kind: 'full', rows: [] })).statusCode,
    401
  );
  assert.deepEqual(fs.readdirSync(dataRoot), []);
});

test('a beacon body sent as text is still read', async () => {
  const { handler, runDir } = setup();
  const res = await post(
    handler,
    JSON.stringify({ kind: 'incremental', rows: [{ trial: 9 }] })
  );
  assert.equal(res.statusCode, 200);
  assert.deepEqual(
    readAsCollectDoes(path.join(runDir, 'incremental.json'))[0].data,
    [{ trial: 9 }]
  );
});

test('the save client posts to the route and surfaces its error', async () => {
  const requests = [];
  const client = createRuntimeSaveClient({
    runToken: 'a b',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return requests.length === 1
        ? { ok: true }
        : { ok: false, status: 409, json: async () => ({ error: 'conflict' }) };
    },
    sendBeacon: () => false,
  });
  await client.save('full', { rows: [{ a: 1 }], aggregated: { s: 1 } });
  assert.equal(requests[0].url, '/api/runtime/save?runToken=a%20b');
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    kind: 'full',
    rows: [{ a: 1 }],
    aggregated: { s: 1 },
  });
  await assert.rejects(client.save('full', { rows: [] }), /conflict/);
});

test('the beacon falls back to a request when the browser refuses it', async () => {
  const beacons = [];
  const fetched = [];
  const client = createRuntimeSaveClient({
    runToken: 'token',
    fetchImpl: async (url, init) => {
      fetched.push(JSON.parse(init.body));
      return { ok: true };
    },
    sendBeacon: (url, data) => {
      beacons.push(url);
      return data.size > 1000;
    },
  });
  const { beacon } = client;
  beacon('incremental', { rows: [{ a: 1 }] });
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  assert.equal(beacons.length, 1);
  assert.deepEqual(fetched, [{ kind: 'incremental', rows: [{ a: 1 }] }]);
});
