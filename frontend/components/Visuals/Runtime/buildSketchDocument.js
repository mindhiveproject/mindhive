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
export const PARAMETERS_TEMPLATE = `// Every parameter this sketch exposes. The Parameters tab renders whatever you
// declare here, and \`params.<key>\` holds the live value inside the sketch.
declareParameters({
  size: { type: "number", label: "Size", default: 0.5, min: 0, max: 1 },
});
`;

export const ENTRY_TEMPLATE = `function setup() {
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

/**
 * Runs before any user code. Sets up the two things the sketch talks to — the
 * live `params` object and `declareParameters` — plus the log/error relay and
 * the message channel back to the app.
 *
 * Posts to "*" rather than a fixed origin on purpose: the frame is sandboxed
 * *without* `allow-same-origin`, so it has an opaque origin and cannot name
 * ours. The nonce, not the origin, is what makes a message trustworthy — and
 * dropping `allow-same-origin` is what stops a shared visual's code from
 * reaching into the parent page in the first place.
 */
function preamble(nonce) {
  return `
(function () {
  var NONCE = ${JSON.stringify(nonce)};
  function post(message) {
    try {
      parent.postMessage(Object.assign({ nonce: NONCE }, message), "*");
    } catch (e) {}
  }
  window.__post = post;

  // Live parameter values. The app overwrites entries as mappings resolve; the
  // sketch only ever reads them.
  window.params = {};
  window.__paused = false;

  window.declareParameters = function (declaration) {
    var decl = declaration || {};
    Object.keys(decl).forEach(function (key) {
      if (!(key in window.params)) window.params[key] = decl[key] && decl[key].default;
    });
    post({ type: "declare", parameters: decl });
  };

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

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.nonce !== NONCE) return;
    if (data.type === "params" && data.values) {
      Object.assign(window.params, data.values);
    } else if (data.type === "pause") {
      window.__paused = !!data.paused;
    }
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
        if (typeof noLoop === "function") noLoop();
      }
    };
  }
  window.__post({ type: "ready" });
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
