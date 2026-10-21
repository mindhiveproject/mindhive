const test = require('node:test');
const assert = require('node:assert/strict');
const frontend = require('./runtimeConfig');

// The server copy is read from the repository, not imported at runtime: the
// two packages deploy separately.
// eslint-disable-next-line import/no-relative-packages
const server = require('../../../../keystone/lib/runtime/runtimeCore');

const author = { id: 'author' };
const template = { id: 't1', version: '4', author };
const visual = { id: 'v1', author };
const jsPsych = {
  id: 'j1',
  version: '2',
  author,
  archive: { filename: 'experiment.zip' },
  entryPoint: 'index.html',
  manifest: { files: ['index.html', 'js/task.js'] },
};

const CASES = {
  'legacy Lab.js task': { template },
  'Lab.js task': { runtimeType: 'LABJS', template },
  'p5 task': { runtimeType: 'P5', visual },
  'jsPsych task': { runtimeType: 'JSPSYCH', jsPsychExperiment: jsPsych },
  'unknown runtime': { runtimeType: 'PSYCHOPY', template },
  'no asset': { runtimeType: 'P5' },
  'two assets': { runtimeType: 'LABJS', template, visual },
  'asset for another runtime': { runtimeType: 'P5', template },
  'jsPsych without archive': {
    runtimeType: 'JSPSYCH',
    jsPsychExperiment: { ...jsPsych, archive: null },
  },
  'jsPsych entry outside manifest': {
    runtimeType: 'JSPSYCH',
    jsPsychExperiment: { ...jsPsych, entryPoint: 'other.html' },
  },
  'jsPsych path escaping the archive': {
    runtimeType: 'JSPSYCH',
    jsPsychExperiment: {
      ...jsPsych,
      manifest: { files: ['index.html', '../secret.js'] },
    },
  },
  'jsPsych empty manifest': {
    runtimeType: 'JSPSYCH',
    jsPsychExperiment: { ...jsPsych, manifest: { files: [] } },
  },
};

function outcome(resolve, task) {
  try {
    const { runtimeType, assetField, asset, assetVersion } = resolve(task);
    return { runtimeType, assetField, assetId: asset.id, assetVersion };
  } catch (error) {
    return { error: error.message };
  }
}

for (const [name, task] of Object.entries(CASES)) {
  test(`frontend and server resolve the same runtime: ${name}`, () => {
    assert.deepEqual(
      outcome(frontend.resolveRuntimeConfiguration, task),
      outcome(server.resolveRuntimeConfiguration, task)
    );
  });
}

test('both copies list the same runtime asset fields', () => {
  assert.deepEqual(frontend.RUNTIME_ASSET_FIELDS, server.RUNTIME_ASSET_FIELDS);
});
