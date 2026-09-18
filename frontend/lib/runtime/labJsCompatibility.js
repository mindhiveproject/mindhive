// Stay under Keystone's 10mb GraphQL bodyParser. Raw Lab.js rows remain on
// the filesystem; only a size-safe FINAL payload is forwarded to ingest.
const GRAPHQL_INGEST_BUDGET_BYTES = 8 * 1024 * 1024;

function aggregateLabJsRows(data) {
  return (Array.isArray(data) ? data : [])
    .filter((row) => row?.aggregated)
    .map((row) => row.aggregated)
    .reduce((previous, current) => ({ ...previous, ...current }), {});
}

function neutralLabJsFinal(data) {
  const rows = Array.isArray(data) ? data : [];
  return { data: rows, aggregated: aggregateLabJsRows(rows) };
}

function labJsGraphqlFinalPayload(data) {
  const finalResult = neutralLabJsFinal(data);
  const serialized = JSON.stringify({
    data: finalResult.data,
    aggregated: finalResult.aggregated,
  });
  if (Buffer.byteLength(serialized, 'utf8') <= GRAPHQL_INGEST_BUDGET_BYTES) {
    return finalResult;
  }
  return { data: [], aggregated: finalResult.aggregated };
}

function stampLabJsMetadata(runContext, metadata) {
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

module.exports = {
  GRAPHQL_INGEST_BUDGET_BYTES,
  aggregateLabJsRows,
  labJsGraphqlFinalPayload,
  neutralLabJsFinal,
  stampLabJsMetadata,
};
