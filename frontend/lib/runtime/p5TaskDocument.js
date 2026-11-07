// The document a p5 study task runs in (W32). Like the visual builder's
// sketch document, but on the mindhive-runtime/2 bridge and with the pinned
// p5 instead of the CDN. A sketch written for either namespace runs:
//
//   yq.params / params / data
//                      parameter values: the task's, then kept live from the
//                      study's devices by the parent
//   yq.sources         the study's devices and whether each is connected
//   yq.declareParameters
//                      fills in defaults for values the task didn't set, and
//                      tells the parent what to feed
//   yq.sendEvent(l, v) the same marker as MindHive.marker(l, v): saved as a
//                      marker row and passed to the study's marker stream
//   MindHive.saveRow(row), MindHive.finish(aggregated)
//                      results, as for jsPsych
//
// p5 starts itself on page load whenever `setup` or `draw` exists, which
// would run the sketch before its parameters arrive. So they are hidden until
// MindHive's init, then p5 is started in global mode. An error in setup or
// draw ends the run as a failure.
//
// p5 2.x: there is no `preload` (load assets with `await` in an async
// `setup`, which p5 awaits), so only setup and draw are held, and a setup
// that rejects fails the run like one that throws.

const {
  frameClientSource,
} = require('../../components/Tasks/Run/runtimeProtocol');
const { P5_VERSION } = require('./p5Version');

const P5_URL = `/api/runtime/p5/p5.js?v=${P5_VERSION}`;
const HOOKS = ['setup', 'draw'];

/** Globals the sketch uses, defined before any of its code. */
function p5TaskPreludeSource() {
  return `
(function () {
  var MindHive = window.MindHive;
  window.params = MindHive.params;
  window.data = MindHive.params;
  window.sources = MindHive.sources;
  window.declareParameters = function (declaration) {
    var decl = declaration || {};
    Object.keys(decl).forEach(function (key) {
      if (!(key in MindHive.params)) MindHive.params[key] = decl[key] && decl[key].default;
    });
    MindHive.declare(decl);
  };
  window.sendEvent = function (label, value) {
    MindHive.marker(String(label), value, Date.now());
  };
  window.yq = {
    params: MindHive.params,
    declareParameters: window.declareParameters,
    sendEvent: window.sendEvent,
  };
  Object.defineProperty(window.yq, "sources", {
    enumerable: true,
    get: function () { return MindHive.sources; },
  });
  // A sketch that called noLoop() only draws when asked, so a new value
  // would otherwise never reach the canvas.
  MindHive.onUpdate(function () {
    window.sources = MindHive.sources;
    try {
      if (typeof isLooping === "function" && !isLooping()) redraw();
    } catch (e) {}
  });
})();
`;
}

/** Runs after the sketch's code: holds p5 back until init, then starts it. */
function p5TaskStartSource() {
  return `
(function () {
  var MindHive = window.MindHive;
  var hooks = ${JSON.stringify(HOOKS)};
  var held = {};
  function fail(name, error) {
    MindHive.fail(name + ": " + ((error && error.message) || String(error)), (error && error.stack) || "");
    try { if (typeof noLoop === "function") noLoop(); } catch (e) {}
  }
  hooks.forEach(function (name) {
    var original = window[name];
    if (typeof original !== "function") return;
    held[name] = function () {
      var result;
      try {
        result = original.apply(this, arguments);
      } catch (error) {
        fail(name, error);
        return undefined;
      }
      if (result && typeof result.then === "function") {
        return result.then(null, function (error) { fail(name, error); });
      }
      return result;
    };
    window[name] = undefined;
  });
  if (!held.setup && !held.draw) return;
  MindHive.onInit(function () {
    hooks.forEach(function (name) { if (held[name]) window[name] = held[name]; });
    new window.p5();
    MindHive.ready();
  });
})();
`;
}

// A sketch's own "</script>" would end the tag early.
function inlineScript(code) {
  return `<script>\n${String(code || '').replace(
    /<\/(script)/gi,
    '<\\/$1'
  )}\n</script>`;
}

/**
 * Builds the document from a visual's code files, in the visual builder's
 * order: parameters, then modules, then the entry file. Files that aren't
 * JavaScript become string constants named after the file.
 *
 * @param {Array<{name, role, language, content}>} files
 * @param {string} nonce
 */
function buildP5TaskDocument(files, nonce) {
  const ordered = [
    ...files.filter((file) => file.role === 'parameters'),
    ...files.filter((file) => file.role === 'module'),
    ...files.filter((file) => file.role === 'entry'),
  ];
  const code = ordered.map((file) =>
    file.language === 'javascript'
      ? inlineScript(file.content)
      : inlineScript(
          `window[${JSON.stringify(
            String(file.name).replace(/\.[^.]+$/, '')
          )}] = ${JSON.stringify(file.content || '')};`
        )
  );
  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8" />',
    `<script>${frameClientSource(nonce)}</script>`,
    `<script>${p5TaskPreludeSource()}</script>`,
    `<script src="${P5_URL}"></script>`,
    '<style>',
    '  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #171717; }',
    '  canvas { display: block; }',
    '</style>',
    '</head>',
    '<body>',
    ...code,
    `<script>${p5TaskStartSource()}</script>`,
    '</body>',
    '</html>',
  ].join('\n');
}

module.exports = {
  P5_VERSION,
  buildP5TaskDocument,
  p5TaskPreludeSource,
  p5TaskStartSource,
};
