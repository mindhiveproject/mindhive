const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveRuntimeConfiguration } = require('./runtimeConfig');

test('frontend dispatcher resolves each supported runtime', () => {
  assert.equal(
    resolveRuntimeConfiguration({ runtimeType: 'P5', visual: { id: 'v1' } })
      .assetField,
    'visual'
  );
  assert.equal(
    resolveRuntimeConfiguration({
      runtimeType: 'JSPSYCH',
      jsPsychExperiment: {
        id: 'j1',
        entryPoint: 'index.html',
        manifest: { files: ['index.html'] },
        archive: { filename: 'experiment.zip' },
      },
    }).assetField,
    'jsPsychExperiment'
  );
});
