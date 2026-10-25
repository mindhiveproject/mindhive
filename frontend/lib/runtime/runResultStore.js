// What every runtime's save route shares: reading the run behind a run token,
// writing the raw result files Collect reads, and sending FINAL and COMPLETE
// to the run service. /api/save (Lab.js) and /api/runtime/save (jsPsych, p5)
// both build on it, so the files on disk stay in one format.
//
// Plain CommonJS so it runs under `node --test`; the routes pass in the
// TypeScript path guards from lib/api/paths.

const path = require('path');
const fs = require('fs');
const jsonfile = require('jsonfile');

// Stay under Keystone's 10mb GraphQL bodyParser. Raw rows remain on the
// filesystem; only a size-safe FINAL payload is forwarded to ingest.
const GRAPHQL_INGEST_BUDGET_BYTES = 8 * 1024 * 1024;

const RUN_CONTEXT_QUERY = `
  query RuntimeRunContext($runToken: String!) {
    runtimeRunContext(runToken: $runToken) {
      datasetToken
      date
      runtimeType
      testVersion
      studyVersion
      assetId
      assetVersion
      participantType
      participantPublicId
      studyId
      taskId
      templateId
    }
  }
`;

const INGEST_FINAL_MUTATION = `
  mutation IngestRunFinal(
    $runToken: String!
    $data: JSON
    $aggregated: JSON
  ) {
    ingestRunMessage(
      runToken: $runToken
      sequence: 1
      messageType: FINAL
      data: $data
      aggregated: $aggregated
    ) {
      accepted
      duplicate
      datasetToken
    }
  }
`;

const INGEST_COMPLETE_MUTATION = `
  mutation IngestRunComplete($runToken: String!) {
    ingestRunMessage(
      runToken: $runToken
      sequence: 2
      messageType: COMPLETE
    ) {
      accepted
      duplicate
      datasetToken
    }
  }
`;

// A run that broke before finishing. Nothing was ingested before it (rows go
// to disk only), so it is the run's first message.
const INGEST_FAILURE_MUTATION = `
  mutation IngestRunFailure($runToken: String!, $error: String!) {
    ingestRunMessage(
      runToken: $runToken
      sequence: 1
      messageType: FAILURE
      error: $error
    ) {
      accepted
      duplicate
      datasetToken
    }
  }
`;

/** Run metadata stamped on every stored result file, for any runtime. */
function stampRunMetadata(runContext, metadata) {
  return {
    ...(metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? metadata
      : {}),
    id: runContext.datasetToken,
    runtimeType: runContext.runtimeType,
    runtimeAssetId: runContext.assetId,
    runtimeAssetVersion: runContext.assetVersion,
    testVersion: runContext.testVersion,
    studyVersion: runContext.studyVersion,
    study: runContext.studyId,
    template: runContext.templateId,
    task: runContext.taskId,
    type: runContext.participantType,
    publicId: runContext.participantPublicId,
  };
}

/** The FINAL payload, dropping the rows when they would not fit ingest. */
function finalIngestPayload(rows, aggregated) {
  const data = Array.isArray(rows) ? rows : [];
  const serialized = JSON.stringify({ data, aggregated });
  if (Buffer.byteLength(serialized, 'utf8') <= GRAPHQL_INGEST_BUDGET_BYTES) {
    return { data, aggregated };
  }
  return { data: [], aggregated };
}

async function loadRunContext(graphql, runToken) {
  const result = await graphql(RUN_CONTEXT_QUERY, { runToken });
  return result.runtimeRunContext;
}

async function ingestFailure(graphql, runToken, error) {
  await graphql(INGEST_FAILURE_MUTATION, { runToken, error });
}

async function ingestFinalAndComplete(graphql, runToken, { data, aggregated }) {
  await graphql(INGEST_FINAL_MUTATION, { runToken, data, aggregated });
  await graphql(INGEST_COMPLETE_MUTATION, { runToken });
}

/**
 * The run's raw-data folder, data/<year>/<month>/<day>/<datasetToken>. The
 * date is the Dataset's own, which is what every reader rebuilds the path
 * from — not this request's clock, which disagrees with it on padding and
 * across midnight. Throws when any part is unsafe.
 */
function runDirectory({
  dataRoot,
  runContext,
  validatePathSegment,
  assertWithinBase,
}) {
  const { datasetToken, date } = runContext;
  const [year, month, day] = String(date ?? '').split('-');
  validatePathSegment(datasetToken, 'dataset token');
  validatePathSegment(year, 'year');
  validatePathSegment(month, 'month');
  validatePathSegment(day, 'day');
  const dir = path.resolve(dataRoot, year, month, day, datasetToken);
  assertWithinBase(dir, dataRoot);
  return dir;
}

/**
 * Writes `<payload>.json` in the Lab.js layout: `full` is written once
 * (`duplicate: true` when it already exists), `modified` is replaced, and
 * anything else is appended as one more `,\n`-terminated object.
 */
async function writeRawResult({ dir, payload, body }) {
  const filePath = path.join(dir, `${payload}.json`);
  await fs.promises.mkdir(dir, { recursive: true });
  if (payload === 'modified') {
    await jsonfile.writeFile(filePath, body);
    return { duplicate: false };
  }
  try {
    await jsonfile.writeFile(filePath, body, {
      flag: payload === 'full' ? 'wx' : 'a',
      EOL: ',\n',
    });
  } catch (error) {
    if (payload === 'full' && error?.code === 'EEXIST') {
      return { duplicate: true };
    }
    throw error;
  }
  return { duplicate: false };
}

module.exports = {
  GRAPHQL_INGEST_BUDGET_BYTES,
  INGEST_COMPLETE_MUTATION,
  INGEST_FAILURE_MUTATION,
  INGEST_FINAL_MUTATION,
  RUN_CONTEXT_QUERY,
  finalIngestPayload,
  ingestFailure,
  ingestFinalAndComplete,
  loadRunContext,
  runDirectory,
  stampRunMetadata,
  writeRawResult,
};
