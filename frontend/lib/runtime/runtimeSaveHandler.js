// /api/runtime/save: where the study runner sends a jsPsych or p5 run's rows.
//
// The runner (never the task frame, whose origin is null) posts
// `{kind, rows, aggregated}` with the run token in the query string:
//   incremental  rows appended to incremental.json as they arrive
//   full         every row, written once to full.json, then FINAL and
//                COMPLETE to the run service
// Files use the Lab.js `{metadata, data}` layout, so Collect reads them as is.

const {
  finalIngestPayload,
  ingestFinalAndComplete,
  loadRunContext,
  runDirectory,
  stampRunMetadata,
  writeRawResult,
} = require('./runResultStore');

const RUNTIMES = ['JSPSYCH', 'P5'];
const KINDS = ['incremental', 'full'];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// navigator.sendBeacon can arrive as text when the browser drops the type.
function parseBody(body) {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

/**
 * @param {object} deps
 * @param {(query: string, variables: object) => Promise<object>} deps.graphql
 * @param {string} deps.dataRoot - Absolute path of the raw-data folder.
 * @param {Function} deps.validatePathSegment
 * @param {Function} deps.assertWithinBase
 * @param {(req, res) => boolean} [deps.limiter] - Writes its own 429.
 */
function createRuntimeSaveHandler({
  graphql,
  dataRoot,
  validatePathSegment,
  assertWithinBase,
  limiter,
}) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).end();
    }
    if (limiter && !limiter(req, res)) return undefined;

    const runToken =
      typeof req.query?.runToken === 'string' ? req.query.runToken : null;
    if (!runToken) {
      return res
        .status(401)
        .json({ error: 'A server-issued run token is required.' });
    }

    const body = parseBody(req.body);
    const kind = body?.kind;
    const rows = body?.rows;
    const aggregated = body?.aggregated ?? {};
    if (
      !KINDS.includes(kind) ||
      !Array.isArray(rows) ||
      !rows.every(isPlainObject) ||
      !isPlainObject(aggregated)
    ) {
      return res.status(400).json({ error: 'Invalid runtime result payload.' });
    }

    let runContext;
    try {
      runContext = await loadRunContext(graphql, runToken);
    } catch {
      return res
        .status(401)
        .json({ error: 'The run token is invalid or expired.' });
    }
    if (!RUNTIMES.includes(runContext?.runtimeType)) {
      return res.status(400).json({
        error:
          'Only jsPsych and p5 runs are saved here; Lab.js uses /api/save.',
      });
    }

    let dir;
    try {
      dir = runDirectory({
        dataRoot,
        runContext,
        validatePathSegment,
        assertWithinBase,
      });
    } catch {
      return res.status(401).json({ error: 'The run token is invalid.' });
    }

    const stored = {
      metadata: stampRunMetadata(runContext, { payload: kind }),
      data: rows,
      ...(kind === 'full' ? { aggregated } : {}),
    };
    let duplicate;
    try {
      ({ duplicate } = await writeRawResult({
        dir,
        payload: kind,
        body: stored,
      }));
    } catch {
      return res
        .status(500)
        .json({ error: 'The raw result could not be stored.' });
    }

    if (kind === 'full') {
      try {
        await ingestFinalAndComplete(
          graphql,
          runToken,
          finalIngestPayload(rows, aggregated)
        );
      } catch (error) {
        return res.status(409).json({
          error:
            error?.message || 'The final runtime result could not be stored.',
        });
      }
    }

    return res.status(200).json({ saved: true, kind, duplicate });
  };
}

module.exports = { createRuntimeSaveHandler };
