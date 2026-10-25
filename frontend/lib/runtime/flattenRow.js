// CSV cells can't hold objects: papaparse writes one as "[object Object]".
// jsPsych survey plugins save their answers as objects (`response: { Q0: … }`)
// and p5 markers carry object values, so for those runtimes nested objects
// become dotted columns (`response.Q0`) and arrays become JSON text. Lab.js
// rows are left exactly as they were exported before.
//
// The exports also add run metadata (task, id, type, …) to every row. A
// jsPsych or p5 row can have its own field with one of those names (a
// `task: "response"` label, say), so that value is kept as `data.<name>`
// instead of being overwritten.

const FLATTENED_RUNTIMES = ['JSPSYCH', 'P5'];
const MAX_DEPTH = 5;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function flattenInto(out, prefix, value, depth) {
  if (isPlainObject(value) && depth < MAX_DEPTH) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      out[prefix] = '';
      return;
    }
    for (const [key, nested] of entries) {
      flattenInto(out, `${prefix}.${key}`, nested, depth + 1);
    }
    return;
  }
  out[prefix] =
    Array.isArray(value) || isPlainObject(value)
      ? JSON.stringify(value)
      : value;
}

/**
 * One exported row, flattened when it comes from a jsPsych or p5 run.
 *
 * @param {object} row
 * @param {string} runtimeType
 * @param {string[]} [reservedKeys] - Columns the export sets after the row;
 *   a row field with one of these names moves to `data.<name>`.
 */
function flattenRuntimeRow(row, runtimeType, reservedKeys = []) {
  if (!FLATTENED_RUNTIMES.includes(runtimeType) || !isPlainObject(row)) {
    return row;
  }
  const flat = {};
  for (const [key, value] of Object.entries(row)) {
    flattenInto(flat, key, value, 0);
  }
  const reserved = new Set(reservedKeys);
  const out = {};
  for (const [key, value] of Object.entries(flat)) {
    out[reserved.has(key) ? `data.${key}` : key] = value;
  }
  return out;
}

module.exports = { flattenRuntimeRow };
