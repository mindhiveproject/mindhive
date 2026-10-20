const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { PostMessageTransport } = require('yq-data');
const {
  PROTOCOL,
  frameClientSource,
  initMessage,
  validateFrameMessage,
} = require('./runtimeProtocol');
const { createRuntimeFrameConnection } = require('./runtimeFrameConnection');
const { createRunBuffer } = require('./runBuffer');

const message = (fields) => ({ protocol: PROTOCOL, ...fields });

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitFor(predicate, timeoutMs = 1000) {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error('Timed out waiting');
    await sleep(5);
  }
}

function createHost() {
  const listeners = new Set();
  return {
    addEventListener: (type, fn) => type === 'message' && listeners.add(fn),
    removeEventListener: (type, fn) => listeners.delete(fn),
    emit: (event) => [...listeners].forEach((fn) => fn(event)),
    get listenerCount() {
      return listeners.size;
    },
  };
}

// Runs the real in-frame client in its own realm, wired to `host` the way a
// sandboxed iframe is wired to the page: window messages for the handshake
// (structured-cloned, as a browser does across windows), a transferred
// MessagePort after it.
function createFakeFrame(host, nonce, experiment = '') {
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
  });
  // In a browser the window is the global object.
  context.window = context;
  vm.runInContext(frameClientSource(nonce), context);
  vm.runInContext(experiment, context);
  return {
    frameWindow,
    run: (code) => vm.runInContext(code, context),
    dispatch: (event) => events.dispatchEvent(event),
    stop: () => intervals.forEach(clearInterval),
  };
}

function connectTo(host, frameWindow, nonce, handlers, init) {
  return createRuntimeFrameConnection({
    nonce,
    host,
    getFrameWindow: () => frameWindow,
    init: init || { runtime: 'JSPSYCH', mode: 'persist', params: { n: 3 } },
    handlers,
    createTransport: async (port) =>
      new PostMessageTransport({ target: port, source: port }),
  });
}

test('frame messages are normalized or refused', () => {
  assert.deepEqual(validateFrameMessage(message({ type: 'ready' })), {
    ok: true,
    message: { type: 'ready' },
  });
  assert.equal(validateFrameMessage({ type: 'ready' }).ok, false);
  assert.equal(validateFrameMessage(message({ type: 'save' })).ok, false);
  assert.equal(
    validateFrameMessage(message({ type: 'rows', rows: [] })).ok,
    false
  );
  assert.equal(
    validateFrameMessage(message({ type: 'rows', rows: [[1, 2]] })).ok,
    false
  );
  assert.equal(
    validateFrameMessage(message({ type: 'rows', rows: [{ rt: 412 }] })).ok,
    true
  );
  assert.equal(
    validateFrameMessage(message({ type: 'marker', label: '', time: 1 })).ok,
    false
  );
  assert.deepEqual(
    validateFrameMessage(message({ type: 'marker', label: 'onset', time: 5 }))
      .message,
    { type: 'marker', label: 'onset', value: null, time: 5 }
  );
  assert.deepEqual(
    validateFrameMessage(message({ type: 'finish' })).message.aggregated,
    {}
  );
  assert.equal(
    validateFrameMessage(message({ type: 'finish', aggregated: [] })).ok,
    false
  );
  assert.equal(
    validateFrameMessage(
      message({ type: 'failure', message: 'x'.repeat(20000) })
    ).message.message.length,
    16 * 1024
  );
  assert.equal(
    validateFrameMessage(message({ type: 'log', level: 'debug', message: '' }))
      .ok,
    false
  );
});

test('init refuses an unknown run mode', () => {
  assert.throws(() => initMessage({ runtime: 'P5', mode: 'live' }));
  assert.equal(
    initMessage({ runtime: 'P5', mode: 'preview' }).params.constructor,
    Object
  );
});

test('a frame connects, receives init, and its results reach the parent', async () => {
  const host = createHost();
  const nonce = 'nonce-1';
  const seen = { ready: 0, rows: [], markers: [], finish: null, rejected: [] };
  const frame = createFakeFrame(
    host,
    nonce,
    `MindHive.onInit(function (mh) {
       mh.saveRow({ param: mh.params.n, mode: mh.mode, rt: NaN, samples: new Float32Array([1, 2]) });
       mh.marker("stimulus_onset", { trial: 1 }, 1234);
       mh.ready();
       mh.finish({ accuracy: 0.9 });
       mh.saveRow({ late: true });
     });`
  );
  const connection = connectTo(host, frame.frameWindow, nonce, {
    onReady: () => (seen.ready += 1),
    onRows: (rows) => seen.rows.push(...rows),
    onMarker: (marker) => seen.markers.push(marker),
    onFinish: (result) => (seen.finish = result),
    onRejected: (reason) => seen.rejected.push(reason),
  });
  connection.start();
  try {
    await waitFor(() => seen.finish);
    assert.equal(connection.isConnected(), true);
    assert.deepEqual(seen.rows, [
      { param: 3, mode: 'persist', rt: null, samples: [1, 2] },
    ]);
    assert.deepEqual(seen.markers, [
      { label: 'stimulus_onset', value: { trial: 1 }, time: 1234 },
    ]);
    assert.equal(seen.ready, 1);
    assert.deepEqual(seen.finish, {
      aggregated: { accuracy: 0.9 },
      rows: undefined,
    });
    assert.deepEqual(seen.rejected, []);
  } finally {
    connection.close();
    frame.stop();
  }
  assert.equal(host.listenerCount, 0);
});

test('a frame with the wrong nonce or from another window gets no port', async () => {
  const host = createHost();
  const impostor = createFakeFrame(host, 'guessed-nonce');
  const stranger = createFakeFrame(host, 'nonce-2');
  const expected = { postMessage() {} };
  const connection = connectTo(host, expected, 'nonce-2', {});
  connection.start();
  try {
    await sleep(250);
    assert.equal(connection.isConnected(), false);
  } finally {
    connection.close();
    impostor.stop();
    stranger.stop();
  }
});

test('an uncaught error becomes a failure and ends the run', async () => {
  const host = createHost();
  const failures = [];
  const rejected = [];
  const frame = createFakeFrame(host, 'nonce-3');
  const connection = connectTo(host, frame.frameWindow, 'nonce-3', {
    onFailure: (failure) => failures.push(failure),
    onRejected: (reason) => rejected.push(reason),
  });
  connection.start();
  try {
    await waitFor(() => connection.isConnected());
    const error = new Event('error');
    error.error = new Error('boom');
    frame.dispatch(error);
    await waitFor(() => failures.length === 1);
    assert.equal(failures[0].message, 'boom');
    frame.run('MindHive.saveRow({ after: true })');
    await sleep(20);
    assert.deepEqual(rejected, []);
  } finally {
    connection.close();
    frame.stop();
  }
});

test('pause and abort reach the frame as window events', async () => {
  const host = createHost();
  const frame = createFakeFrame(
    host,
    'nonce-4',
    `window.received = [];
     window.addEventListener("mindhive:pause", function (e) { window.received.push("pause:" + e.detail.paused); });
     window.addEventListener("mindhive:abort", function () { window.received.push("abort"); });`
  );
  const connection = connectTo(host, frame.frameWindow, 'nonce-4', {});
  connection.setPaused(true);
  connection.start();
  try {
    await waitFor(() => connection.isConnected());
    connection.setPaused(false);
    connection.abort();
    await waitFor(() => frame.run('window.received.length') === 3);
    assert.deepEqual(JSON.parse(frame.run('JSON.stringify(window.received)')), [
      'pause:true',
      'pause:false',
      'abort',
    ]);
  } finally {
    connection.close();
    frame.stop();
  }
});

test('the run buffer sends batches in order and retries a failed one', async () => {
  const calls = [];
  let failNext = true;
  const buffer = createRunBuffer({
    batchSize: 2,
    flushIntervalMs: 10,
    save: async (kind, payload) => {
      if (failNext) {
        failNext = false;
        throw new Error('route down');
      }
      calls.push([kind, payload.rows.map((row) => row.i)]);
    },
  });
  buffer.addRows([{ i: 1 }, { i: 2 }]);
  buffer.addRows([{ i: 3 }]);
  await waitFor(() => calls.length > 0);
  await buffer.flush();
  assert.deepEqual(
    calls.flatMap(([, rows]) => rows),
    [1, 2, 3]
  );
  assert.ok(calls.every(([kind]) => kind === 'incremental'));
  buffer.dispose();
});

test("finish saves every row plus markers, preferring the frame's own rows", async () => {
  const saved = [];
  const buffer = createRunBuffer({
    batchSize: 100,
    flushIntervalMs: 1000,
    save: async (kind, payload) => saved.push([kind, payload]),
  });
  buffer.addRows([{ trial: 1 }]);
  buffer.addMarker({ label: 'onset', value: null, time: 7 });
  await buffer.finish({
    aggregated: { score: 1 },
    rows: [{ trial: 1, rt: 300 }],
  });
  assert.deepEqual(saved, [
    [
      'full',
      {
        aggregated: { score: 1 },
        rows: [
          { trial: 1, rt: 300 },
          { mh_kind: 'marker', label: 'onset', value: null, time: 7 },
        ],
      },
    ],
  ]);
});

test('finish retries the full save and reports when every attempt fails', async () => {
  let attempts = 0;
  const buffer = createRunBuffer({
    retryDelaysMs: [0, 0],
    save: async () => {
      attempts += 1;
      throw new Error('still down');
    },
  });
  buffer.addRows([{ trial: 1 }]);
  await assert.rejects(buffer.finish(), /still down/);
  assert.equal(attempts, 3);
});

test('page unload sends waiting rows through the beacon', () => {
  const beacons = [];
  const buffer = createRunBuffer({
    flushIntervalMs: 1000,
    save: async () => {},
    beacon: (kind, payload) => beacons.push([kind, payload.rows.length]),
  });
  buffer.addRows([{ a: 1 }, { a: 2 }]);
  buffer.flushOnUnload();
  assert.deepEqual(beacons, [['incremental', 2]]);
  buffer.dispose();
});
