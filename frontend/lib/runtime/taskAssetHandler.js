// The two routes a jsPsych task frame loads from (W4).
//
//   /api/runtime/task/<asset token>/<archive path>?n=<nonce>
//     One version's unpacked files. The token is a path segment, so the
//     experiment's relative URLs keep it without a base href. The entry point
//     gets the frame client, the pinned jsPsych, the plugins the experiment
//     uses and the shim, injected before the experiment's own scripts.
//
//   /api/runtime/jspsych/<file>?v=<version>
//     The pinned jsPsych and plugins, straight from node_modules.
//
// The frame is sandboxed with a null origin, so every response allows
// cross-origin loading (CORS and CORP), and the app's own headers don't apply
// (see next.config.js). Every task response also carries a CSP `sandbox`, so
// a task file opened outside the frame still can't act as the app.

const fs = require('fs');
const path = require('path');
const {
  frameClientSource,
} = require('../../components/Tasks/Run/runtimeProtocol');
const {
  isSafeArchivePath,
} = require('../../components/Tasks/Run/runtimeConfig');
const {
  JSPSYCH_VERSION,
  packageScript,
  packageStyle,
} = require('./jspsychEnvelope');
const { jsPsychShimSource } = require('./jspsychShim');

const CONTENT_TYPES = {
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  xml: 'application/xml',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  mp4: 'video/mp4',
  webm: 'video/webm',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  wasm: 'application/wasm',
};

const NONCE_RE = /^[A-Za-z0-9-]{8,80}$/;

function contentType(file) {
  const extension = path.extname(file).slice(1).toLowerCase();
  return CONTENT_TYPES[extension] || 'application/octet-stream';
}

function setCrossOriginHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

function requestOrigin(req) {
  const forwarded = req.headers?.['x-forwarded-proto'];
  const proto = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || 'http';
  const host = req.headers?.host;
  return host ? `${String(proto).split(',')[0].trim()}://${host}` : null;
}

/**
 * The task's own policy (C8): open network access for the experiment, but
 * only framed by the app, and always sandboxed.
 */
function taskContentSecurityPolicy(appOrigin) {
  return [
    'sandbox allow-scripts allow-forms',
    "default-src * data: blob: 'unsafe-inline' 'unsafe-eval'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    `frame-ancestors 'self'${appOrigin ? ` ${appOrigin}` : ''}`,
  ].join('; ');
}

function envelopeUrl(file) {
  return `/api/runtime/jspsych/${file}?v=${JSPSYCH_VERSION}`;
}

/** The scripts and styles a task document gets before its own code runs. */
function runtimeHead({ nonce, plugins = [] }) {
  const styles = ['jspsych', ...plugins]
    .filter((name) => packageStyle(name))
    .map(
      (name) =>
        `<link rel="stylesheet" href="${envelopeUrl(
          name === 'jspsych' ? 'jspsych.css' : `plugin-${name}.css`
        )}">`
    );
  const scripts = [
    `<script src="${envelopeUrl('jspsych.js')}"></script>`,
    ...plugins
      .filter((name) => packageScript(name))
      .map(
        (name) => `<script src="${envelopeUrl(`plugin-${name}.js`)}"></script>`
      ),
  ];
  return [
    `<script>${frameClientSource(nonce)}</script>`,
    ...styles,
    ...scripts,
    `<script>${jsPsychShimSource()}</script>`,
  ].join('\n');
}

/** Puts the runtime head first in the document, before any of its scripts. */
function injectRuntime(html, options) {
  const head = runtimeHead(options);
  for (const tag of [/<head\b[^>]*>/i, /<html\b[^>]*>/i, /<!doctype[^>]*>/i]) {
    const match = html.match(tag);
    if (match) {
      const at = match.index + match[0].length;
      return `${html.slice(0, at)}\n${head}\n${html.slice(at)}`;
    }
  }
  return `${head}\n${html}`;
}

/**
 * @param {object} deps
 * @param {string} deps.assetRoot - runtime-assets/jspsych.
 * @param {(token: string) => {assetId: string}} deps.verifyAssetToken
 * @param {(assetRoot: string, id: string) => Promise<object>} deps.readManifest
 */
function createTaskFileHandler({ assetRoot, verifyAssetToken, readManifest }) {
  // Versions never change, so each manifest is read from disk once.
  const manifests = new Map();
  return async function handler(req, res) {
    setCrossOriginHeaders(res);
    res.setHeader(
      'Content-Security-Policy',
      taskContentSecurityPolicy(requestOrigin(req))
    );
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return res.status(405).end();
    }

    let claims;
    try {
      claims = verifyAssetToken(String(req.query.token || ''));
    } catch {
      return res
        .status(403)
        .json({ error: 'This task link is invalid or has expired.' });
    }
    // Tokens from before runtimes were named carry none; those are jsPsych's.
    if (claims.runtime && claims.runtime !== 'JSPSYCH') {
      return res
        .status(403)
        .json({ error: 'This task link is not for jsPsych.' });
    }
    const segments = [].concat(req.query.path || []);
    const file = segments.join('/');
    if (!isSafeArchivePath(file)) {
      return res.status(400).json({ error: 'Invalid file path.' });
    }

    let manifest = manifests.get(claims.assetId);
    try {
      if (!manifest) {
        manifest = await readManifest(assetRoot, claims.assetId);
        manifests.set(claims.assetId, manifest);
      }
    } catch {
      return res
        .status(404)
        .json({ error: 'This task version is not available.' });
    }
    if (!manifest.files?.includes(file)) {
      return res.status(404).json({ error: 'File not found.' });
    }
    const filesRoot = path.join(assetRoot, claims.assetId, 'files');
    const filePath = path.resolve(filesRoot, file);
    if (!filePath.startsWith(filesRoot + path.sep)) {
      return res.status(400).json({ error: 'Invalid file path.' });
    }

    let data;
    try {
      data = await fs.promises.readFile(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found.' });
    }

    res.setHeader('Content-Type', contentType(file));
    if (file === manifest.entryPoint) {
      const nonce = String(req.query.n || '');
      if (!NONCE_RE.test(nonce)) {
        return res
          .status(400)
          .json({ error: 'The task frame nonce is missing.' });
      }
      // The nonce is per frame, so the document is never cached.
      res.setHeader('Cache-Control', 'no-store');
      const html = injectRuntime(data.toString('utf8'), {
        nonce,
        plugins: manifest.plugins || [],
      });
      return res.status(200).send(html);
    }
    // Versions never change, but the token expires, so cache privately.
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.status(200).send(data);
  };
}

/** Maps a /api/runtime/jspsych file name onto its node_modules path. */
function envelopeFile(name) {
  if (name === 'jspsych.js') return packageScript('jspsych');
  if (name === 'jspsych.css') return packageStyle('jspsych');
  const match = /^plugin-([a-z-]+)\.(js|css)$/.exec(String(name));
  if (!match) return null;
  return match[2] === 'js' ? packageScript(match[1]) : packageStyle(match[1]);
}

/** Maps a /api/runtime/p5 file name onto its node_modules path. */
function p5File(name) {
  return name === 'p5.js' ? 'p5/lib/p5.min.js' : null;
}

/**
 * Serves pinned runtime libraries from node_modules.
 *
 * @param {object} deps
 * @param {string} deps.modulesRoot - The frontend's node_modules.
 * @param {(name: string) => string | null} [deps.resolveFile] - File name to
 *   package path; the jsPsych envelope by default.
 */
function createEnvelopeFileHandler({
  modulesRoot,
  resolveFile = envelopeFile,
}) {
  return async function handler(req, res) {
    setCrossOriginHeaders(res);
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return res.status(405).end();
    }
    const relative = resolveFile(req.query.file);
    if (!relative) {
      return res.status(404).json({ error: 'Not a pinned runtime file.' });
    }
    let data;
    try {
      data = await fs.promises.readFile(path.join(modulesRoot, relative));
    } catch {
      return res.status(404).json({ error: 'Not a pinned runtime file.' });
    }
    res.setHeader('Content-Type', contentType(relative));
    // The URL carries the pinned version, so a new pin is a new URL.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(data);
  };
}

/**
 * /api/runtime/visual/<asset token>?n=<nonce>: a p5 task's document, built
 * from the visual's code, which Keystone returns only for a p5 asset token.
 *
 * @param {object} deps
 * @param {(token: string) => {assetId: string, runtime?: string}} deps.verifyAssetToken
 * @param {(token: string) => Promise<Array<object>>} deps.loadVisualFiles
 * @param {(files: Array<object>, nonce: string) => string} deps.buildDocument
 */
function createVisualTaskHandler({
  verifyAssetToken,
  loadVisualFiles,
  buildDocument,
}) {
  return async function handler(req, res) {
    setCrossOriginHeaders(res);
    res.setHeader(
      'Content-Security-Policy',
      taskContentSecurityPolicy(requestOrigin(req))
    );
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return res.status(405).end();
    }
    const token = String(req.query.token || '');
    // Checked here too, so a bad link never reaches the backend.
    let claims;
    try {
      claims = verifyAssetToken(token);
    } catch {
      return res
        .status(403)
        .json({ error: 'This task link is invalid or has expired.' });
    }
    if (claims.runtime !== 'P5') {
      return res.status(403).json({ error: 'This task link is not for p5.' });
    }
    const nonce = String(req.query.n || '');
    if (!NONCE_RE.test(nonce)) {
      return res
        .status(400)
        .json({ error: 'The task frame nonce is missing.' });
    }
    let files;
    try {
      files = await loadVisualFiles(token);
    } catch {
      return res.status(404).json({ error: 'This task is not available.' });
    }
    if (!files?.some((file) => file.role === 'entry')) {
      return res.status(404).json({ error: 'This task has no sketch to run.' });
    }
    res.setHeader('Content-Type', CONTENT_TYPES.html);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buildDocument(files, nonce));
  };
}

module.exports = {
  createEnvelopeFileHandler,
  createTaskFileHandler,
  createVisualTaskHandler,
  envelopeFile,
  injectRuntime,
  p5File,
  taskContentSecurityPolicy,
};
