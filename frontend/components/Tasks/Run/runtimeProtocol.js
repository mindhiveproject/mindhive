// The mindhive-runtime/2 bridge between a task frame (jsPsych or p5) and the
// study runner around it.
//
// The frame is sandboxed without `allow-same-origin`, so its origin is opaque
// and it can reach the parent only through `postMessage(…, "*")`. The window
// is therefore used once, for the handshake: the frame repeats `hello` with
// its nonce, the parent answers the first matching one with `connect` and a
// private `MessagePort`, and every later message travels on that port.
//
// The frame never holds the run token and never calls a MindHive server. It
// sends rows, markers and a finish message; the parent decides what to keep.

const PROTOCOL = 'mindhive-runtime/2';

const FRAME_MESSAGE_TYPES = ['ready', 'rows', 'marker', 'finish', 'failure'];
const RUN_MODES = ['persist', 'preview'];

const MAX_ROWS_PER_MESSAGE = 10000;
const MAX_LABEL_LENGTH = 256;
// Matches the run service's cap on a FAILURE message.
const MAX_TEXT_LENGTH = 16 * 1024;

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

function isSerializable(value) {
  try {
    return JSON.stringify(value) !== undefined;
  } catch {
    return false;
  }
}

function truncate(text) {
  return text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text;
}

function rejected(reason) {
  return { ok: false, reason };
}

function validateRows(rows, { allowEmpty, maxRows }) {
  if (!Array.isArray(rows)) return 'rows must be an array';
  if (!allowEmpty && rows.length === 0) return 'rows must not be empty';
  if (maxRows && rows.length > maxRows) return 'too many rows in one message';
  if (!rows.every(isPlainObject)) return 'every row must be a plain object';
  if (!isSerializable(rows)) return 'rows must be JSON-serializable';
  return null;
}

/**
 * Checks a message that arrived on the port from a task frame.
 *
 * The frame runs researcher code, so nothing it sends is trusted: a message
 * comes back either normalized (`ok: true`) or with the reason it was refused.
 *
 * @param {unknown} data - `event.data` from the port.
 * @returns {{ok: true, message: object} | {ok: false, reason: string}}
 */
function validateFrameMessage(data) {
  if (!isPlainObject(data) || data.protocol !== PROTOCOL) {
    return rejected('not a mindhive-runtime/2 message');
  }
  const { type } = data;
  if (!FRAME_MESSAGE_TYPES.includes(type)) {
    return rejected(`unknown message type: ${String(type)}`);
  }

  if (type === 'ready') return { ok: true, message: { type } };

  if (type === 'rows') {
    const problem = validateRows(data.rows, {
      allowEmpty: false,
      maxRows: MAX_ROWS_PER_MESSAGE,
    });
    if (problem) return rejected(problem);
    return { ok: true, message: { type, rows: data.rows } };
  }

  if (type === 'marker') {
    const { label, time } = data;
    const value = data.value === undefined ? null : data.value;
    if (
      typeof label !== 'string' ||
      !label ||
      label.length > MAX_LABEL_LENGTH
    ) {
      return rejected(`marker label must be 1–${MAX_LABEL_LENGTH} characters`);
    }
    if (!Number.isFinite(time)) return rejected('marker time must be a number');
    if (!isSerializable(value)) {
      return rejected('marker value must be JSON-serializable');
    }
    return { ok: true, message: { type, label, value, time } };
  }

  if (type === 'finish') {
    const aggregated = data.aggregated === undefined ? {} : data.aggregated;
    if (!isPlainObject(aggregated) || !isSerializable(aggregated)) {
      return rejected('finish aggregate must be a plain object');
    }
    if (data.rows !== undefined) {
      const problem = validateRows(data.rows, { allowEmpty: true });
      if (problem) return rejected(problem);
    }
    return {
      ok: true,
      message: { type, aggregated, rows: data.rows },
    };
  }

  // failure
  if (typeof data.message !== 'string' || !data.message) {
    return rejected('failure message must be a non-empty string');
  }
  return {
    ok: true,
    message: {
      type,
      message: truncate(data.message),
      stack: typeof data.stack === 'string' ? truncate(data.stack) : '',
    },
  };
}

function isHelloMessage(data, nonce) {
  return (
    isPlainObject(data) &&
    data.protocol === PROTOCOL &&
    data.type === 'hello' &&
    typeof nonce === 'string' &&
    data.nonce === nonce
  );
}

function connectMessage(nonce) {
  return { protocol: PROTOCOL, type: 'connect', nonce };
}

/**
 * The first message on the port. `params` are the task's parameter values,
 * which the frame exposes as `MindHive.params`.
 */
function initMessage({ runtime, mode, params = {} }) {
  if (!RUN_MODES.includes(mode)) throw new Error(`Unknown run mode: ${mode}`);
  if (!isPlainObject(params)) throw new Error('params must be a plain object');
  return { protocol: PROTOCOL, type: 'init', runtime, mode, params };
}

/**
 * The script a task document runs before any experiment code. It answers the
 * handshake and defines `window.MindHive`, which the jsPsych shim and the p5
 * task document build on:
 *
 *   MindHive.params              parameter values, filled in by `init`
 *   MindHive.mode                "persist" or "preview"
 *   MindHive.onInit(callback)    runs once `init` has arrived
 *   MindHive.ready()             the experiment has started
 *   MindHive.saveRow(row)        one result row (also saveRows(rows))
 *   MindHive.marker(label, value, time)
 *   MindHive.finish(aggregated, rows)
 *   MindHive.fail(message, stack)
 *
 * Messages sent before the port exists wait in an outbox, so no result is
 * lost while the handshake completes. Console output stays in the frame:
 * uncaught errors and rejections are what reach the parent, as failures.
 *
 * Plain ES5 on purpose: it is inlined into documents MindHive doesn't build.
 */
function frameClientSource(nonce) {
  return `
(function () {
  var NONCE = ${JSON.stringify(nonce).replace(/</g, '\\u003c')};
  var PROTOCOL = ${JSON.stringify(PROTOCOL)};
  var MAX_ROWS = ${MAX_ROWS_PER_MESSAGE};
  var port = null;
  var outbox = [];
  var finished = false;
  var initialized = false;
  var initCallbacks = [];

  function post(message) {
    var envelope = Object.assign({ protocol: PROTOCOL }, message);
    if (!port) {
      outbox.push(envelope);
      return;
    }
    try {
      port.postMessage(envelope);
    } catch (e) {}
  }

  // Structured clone would carry typed arrays, dates and NaN through, and the
  // result files are JSON, so values are reduced to JSON here.
  function jsonSafe(value, depth) {
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") return isFinite(value) ? value : null;
    if (typeof value === "bigint") return String(value);
    if (typeof value !== "object") return undefined;
    if (depth > 32) return null;
    if (ArrayBuffer.isView(value)) return Array.prototype.slice.call(value);
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) {
      return value.map(function (item) {
        var safe = jsonSafe(item, depth + 1);
        return safe === undefined ? null : safe;
      });
    }
    var out = {};
    Object.keys(value).forEach(function (key) {
      var safe = jsonSafe(value[key], depth + 1);
      if (safe !== undefined) out[key] = safe;
    });
    return out;
  }

  function isRow(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function safeRows(rows) {
    return (rows || []).filter(isRow).map(function (row) { return jsonSafe(row, 0); });
  }

  var MindHive = {
    params: {},
    mode: null,
    onInit: function (callback) {
      if (initialized) callback(MindHive);
      else initCallbacks.push(callback);
    },
    ready: function () {
      post({ type: "ready" });
    },
    saveRow: function (row) {
      MindHive.saveRows([row]);
    },
    saveRows: function (rows) {
      if (finished) return;
      var clean = safeRows(rows);
      for (var i = 0; i < clean.length; i += MAX_ROWS) {
        post({ type: "rows", rows: clean.slice(i, i + MAX_ROWS) });
      }
    },
    marker: function (label, value, time) {
      if (finished) return;
      var safe = jsonSafe(value, 0);
      post({
        type: "marker",
        label: String(label).slice(0, 256),
        value: safe === undefined ? null : safe,
        time: typeof time === "number" && isFinite(time) ? time : Date.now(),
      });
    },
    finish: function (aggregated, rows) {
      if (finished) return;
      finished = true;
      var message = { type: "finish", aggregated: isRow(aggregated) ? jsonSafe(aggregated, 0) : {} };
      if (Array.isArray(rows)) message.rows = safeRows(rows);
      post(message);
    },
    fail: function (message, stack) {
      if (finished) return;
      finished = true;
      post({
        type: "failure",
        message: String(message || "Unknown error"),
        stack: String(stack || ""),
      });
    },
  };
  window.MindHive = MindHive;

  function onPortMessage(event) {
    var data = event.data;
    if (!data || data.protocol !== PROTOCOL) return;
    if (data.type === "init") {
      if (initialized) return;
      initialized = true;
      MindHive.mode = data.mode;
      Object.assign(MindHive.params, data.params || {});
      initCallbacks.splice(0).forEach(function (callback) {
        try { callback(MindHive); } catch (e) { reportError(e); }
      });
    }
  }

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (port || event.source !== parent) return;
    if (!data || data.protocol !== PROTOCOL || data.type !== "connect") return;
    if (data.nonce !== NONCE || !event.ports || !event.ports[0]) return;
    port = event.ports[0];
    port.onmessage = onPortMessage;
    clearInterval(helloTimer);
    outbox.splice(0).forEach(function (message) {
      try { port.postMessage(message); } catch (e) {}
    });
  });

  // Repeated until answered: the parent's listener may not be attached yet,
  // and a lost hello would leave the frame deaf for good.
  function sayHello() {
    try {
      parent.postMessage({ protocol: PROTOCOL, type: "hello", nonce: NONCE }, "*");
    } catch (e) {}
  }
  var helloTimer = setInterval(sayHello, 200);
  sayHello();

  function reportError(error) {
    MindHive.fail(
      (error && error.message) || String(error) || "Unknown error",
      (error && error.stack) || ""
    );
  }
  window.addEventListener("error", function (event) {
    reportError(event.error || { message: event.message });
  });
  window.addEventListener("unhandledrejection", function (event) {
    reportError(event.reason);
  });
})();
`;
}

module.exports = {
  MAX_ROWS_PER_MESSAGE,
  PROTOCOL,
  RUN_MODES,
  connectMessage,
  frameClientSource,
  initMessage,
  isHelloMessage,
  validateFrameMessage,
};
