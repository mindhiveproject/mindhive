// Assembles the HTML document that runs a visual's sketch inside the preview
// iframe.
//
// Nothing here may import from Builder/ — the Viewer runs the same document.

const P5_URL = "https://cdn.jsdelivr.net/npm/p5@1.11.3/lib/p5.min.js";

/**
 * The parameter declaration is a *call*, not an export.
 *
 * `export const parameters = …` only parses inside a module, and a module can't
 * define p5's global-mode `setup`/`draw` on window — so the sketch would have to
 * change shape to declare its own contract. A plain call works in the classic
 * script p5 already needs, is unambiguous to brace-match when the Parameters tab
 * splices a parameter in or out, and makes the handshake literal: calling it is
 * what posts the declaration up to the app.
 */
export const PARAMETERS_TEMPLATE = `// You can write your parameters here or in the dedicated tab

// Types of parameters:
//   { type: "number", default: 0.5, min: 0, max: 1, step: 0.01 }
//   { type: "category", options: ["calm", "busy"], default: "calm" }
//   { type: "boolean", default: true }
//   { type: "text", default: "Hi!" }
//   { type: "color", default: "#ec40de" }
//   { type: "vector2", default: [0, 0], min: -1, max: 1 }
//   { type: "vector3", default: [0, 0, 0] }

declareParameters({
  size: { type: "number", label: "Size", default: 0.5, min: 0, max: 1 },
});
`;

export const ENTRY_TEMPLATE = `

// Hey! This is a normal p5-sketch with a few custom functions
//   params.<name>       References the parameters declared in code or dashboard
//   sources             the linked data sources and whether each is connected.
//   sendEvent(label, v) used to send event markers.


function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
}

function draw() {
  background(23);
  fill(236, 64, 222);
  circle(width / 2, height / 2, params.size * min(width, height));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
`;

/** Tag on every message between the app and the frame, in the style of yq-data's `yq-data/1`. */
export const PROTOCOL = "yq-visual/1";

/**
 * Runs before any user code. Sets up the things the sketch talks to — the live
 * `params` object, `declareParameters` and `sendEvent` — plus the log/error
 * relay and the channel back to the app.
 *
 * The channel is a private `MessagePort`. The frame is sandboxed *without*
 * `allow-same-origin`, so its origin is opaque: it can only reach the parent
 * with `postMessage(…, "*")`, and a BroadcastChannel can't reach it at all.
 * So the window is used exactly once, for the handshake — the frame says
 * `hello` with its nonce, the app answers `connect` carrying a port — and
 * everything after that travels on the port, where only the two ends can hear
 * it. Dropping `allow-same-origin` is what stops a shared visual's code from
 * reaching into the page around it.
 */
function preamble(nonce) {
  return `
(function () {
  var NONCE = ${JSON.stringify(nonce)};
  var PROTOCOL = ${JSON.stringify(PROTOCOL)};
  var port = null;
  // Declarations and logs happen while the scripts run, before the app has had
  // a chance to answer — they wait here until the port exists.
  var outbox = [];

  function post(message) {
    var envelope = Object.assign({ protocol: PROTOCOL }, message);
    if (!port) {
      if (outbox.length < 200) outbox.push(envelope);
      return;
    }
    try {
      port.postMessage(envelope);
    } catch (e) {}
  }
  window.__post = post;

  // Live parameter values. The app overwrites entries as mappings resolve; the
  // sketch only ever reads them.
  window.params = {};
  // YQ sketches read their values from data. Same object, so it stays live as
  // params is updated in place — and plain assignment, so a sketch that
  // declares its own data is free to.
  window.data = window.params;
  // The linked data sources' connection state, replaced whole whenever a device
  // connects or drops: [{ id, label, streaming, ready, inputs: [{ id, label,
  // required, status, device }] }]. Read-only, like params.
  window.sources = [];
  window.__paused = false;
  window.__crashed = false;
  // Whether the loop was running when the app paused it, so resuming doesn't
  // start a loop in a sketch that stopped its own.
  var resumeLoop = true;

  window.declareParameters = function (declaration) {
    var decl = declaration || {};
    Object.keys(decl).forEach(function (key) {
      if (!(key in window.params)) window.params[key] = decl[key] && decl[key].default;
    });
    post({ type: "declare", parameters: decl });
  };

  // Lets a sketch report something that happened in it — a click, a trial, a
  // stimulus shown. The app can later turn these into event markers.
  window.sendEvent = function (label, value) {
    post({ type: "event", label: String(label), value: value, time: Date.now() });
  };

  function apply(values) {
    Object.assign(window.params, values);
    // A sketch that called noLoop() itself only draws when asked, so a changed
    // value would otherwise never reach the canvas.
    if (window.__paused || window.__crashed) return;
    try {
      if (typeof isLooping === "function" && !isLooping()) redraw();
    } catch (e) {}
  }

  function setPaused(paused) {
    if (paused === window.__paused) return;
    window.__paused = paused;
    // Before p5 has started there is no loop to stop; the draw wrapper honours
    // the flag on its first frame instead.
    if (typeof noLoop !== "function" || typeof loop !== "function") return;
    if (paused) {
      resumeLoop = typeof isLooping === "function" ? isLooping() : true;
      noLoop();
    } else if (!window.__crashed) {
      if (resumeLoop) loop();
      else redraw();
    }
  }

  function onPortMessage(event) {
    var data = event.data;
    if (!data || data.protocol !== PROTOCOL) return;
    if (data.type === "init" || data.type === "params") {
      apply(data.values || {});
    } else if (data.type === "sources") {
      window.sources = data.sources || [];
      // Same as a changed value: a sketch that stopped its own loop would never
      // show the new state otherwise.
      if (window.__paused || window.__crashed) return;
      try {
        if (typeof isLooping === "function" && !isLooping()) redraw();
      } catch (e) {}
    } else if (data.type === "pause") {
      setPaused(!!data.paused);
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

  // Repeated until answered: the app's listener may not be attached yet when
  // this runs, and a lost hello would leave the frame deaf for good.
  function sayHello() {
    try {
      parent.postMessage({ protocol: PROTOCOL, type: "hello", nonce: NONCE }, "*");
    } catch (e) {}
  }
  var helloTimer = setInterval(sayHello, 200);
  sayHello();

  ["log", "warn", "error", "info"].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      var args = Array.prototype.slice.call(arguments);
      post({
        type: "log",
        level: level,
        message: args
          .map(function (a) {
            if (typeof a === "string") return a;
            try { return JSON.stringify(a); } catch (e) { return String(a); }
          })
          .join(" "),
      });
      return original.apply(console, arguments);
    };
  });

  window.addEventListener("error", function (event) {
    post({
      type: "error",
      message: (event.error && event.error.message) || event.message || "Unknown error",
      stack: (event.error && event.error.stack) || "",
      line: event.lineno || 0,
      column: event.colno || 0,
    });
  });
})();
`;
}

/**
 * Wraps setup/draw after the user's code has defined them, so an exception in
 * either surfaces as a message instead of a silent dead canvas, and so pausing
 * can stop the draw loop without the sketch knowing about it.
 */
const POSTAMBLE = `
(function () {
  function guard(name) {
    var original = window[name];
    if (typeof original !== "function") return;
    window[name] = function () {
      try {
        return original.apply(this, arguments);
      } catch (error) {
        window.__post({
          type: "error",
          message: name + ": " + (error.message || String(error)),
          stack: error.stack || "",
        });
        window.__crashed = true;
        if (typeof noLoop === "function") noLoop();
      }
    };
  }
  guard("setup");

  var originalDraw = window.draw;
  if (typeof originalDraw === "function") {
    window.draw = function () {
      if (window.__paused) {
        if (typeof noLoop === "function") noLoop();
        return;
      }
      try {
        return originalDraw.apply(this, arguments);
      } catch (error) {
        window.__post({
          type: "error",
          message: "draw: " + (error.message || String(error)),
          stack: error.stack || "",
        });
        window.__crashed = true;
        if (typeof noLoop === "function") noLoop();
      }
    };
  }
})();
`;

const HEAD = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<script src="${P5_URL}" crossorigin="anonymous"></script>
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #171717; }
  canvas { display: block; }
</style>
</head>
<body>`;

/** Number of lines a chunk occupies once it is joined into the document. */
function lineCount(text) {
  return text.split("\n").length;
}

/**
 * Builds the sketch document.
 *
 * Also returns, per file, the document line its content starts on. YQ hardcoded
 * a `lineno - 65` fudge to map a runtime error back to the editor; that number
 * silently rots the moment the preamble changes, so count it instead.
 *
 * @param {Array<{id: string, name: string, role: string, language: string, content: string}>} files
 * @param {string} nonce - Shared secret for this frame instance.
 * @returns {{ html: string, lineOffsets: Record<string, number> }}
 */
export default function buildSketchDocument(files, nonce) {
  const ordered = [
    ...files.filter((f) => f.role === "parameters"),
    ...files.filter((f) => f.role === "module"),
    ...files.filter((f) => f.role === "entry"),
  ];

  const parts = [];
  const lineOffsets = {};
  // 1-indexed line the next part will start on, tracked as parts are appended.
  let line = 1;
  const append = (part) => {
    parts.push(part);
    line += lineCount(part);
  };

  append(HEAD);
  append(`<script>${preamble(nonce)}</script>`);

  for (const file of ordered) {
    // JavaScript is the only language that becomes a running script; anything
    // else (a shader, a stylesheet) is exposed as a string constant the sketch
    // can reach for by name.
    const body =
      file.language === "javascript"
        ? `<script>\n${file.content || ""}\n</script>`
        : `<script>\nwindow[${JSON.stringify(
            file.name.replace(/\.[^.]+$/, "")
          )}] = ${JSON.stringify(file.content || "")};\n</script>`;
    // The content starts on the line after the opening `<script>`.
    lineOffsets[file.id] = line + 1;
    append(body);
  }

  append(`<script>${POSTAMBLE}</script>`);
  append("</body>");
  append("</html>");

  return { html: parts.join("\n"), lineOffsets };
}
