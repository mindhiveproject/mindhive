const {
  GRAPHQL_INGEST_BUDGET_BYTES,
  finalIngestPayload,
  stampRunMetadata,
} = require('./runResultStore');

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
  return finalIngestPayload(finalResult.data, finalResult.aggregated);
}

// Kept under its Lab.js name for /api/save; the stamp is the same for every
// runtime.
const stampLabJsMetadata = stampRunMetadata;

module.exports = {
  GRAPHQL_INGEST_BUDGET_BYTES,
  aggregateLabJsRows,
  labJsGraphqlFinalPayload,
  neutralLabJsFinal,
  stampLabJsMetadata,
};
