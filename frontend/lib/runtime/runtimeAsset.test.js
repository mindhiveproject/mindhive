const test = require('node:test');
const assert = require('node:assert/strict');
const {
  assetParameterDefinitions,
  runtimeAssetVariables,
} = require('./runtimeAsset');

const definitions = [{ name: 'trials', type: 'number', value: 20 }];

test('parameter definitions come from the task runtime asset', () => {
  assert.deepEqual(
    assetParameterDefinitions({ template: { parameters: definitions } }),
    definitions
  );
  assert.deepEqual(
    assetParameterDefinitions({
      runtimeType: 'JSPSYCH',
      template: { parameters: [{ name: 'stale' }] },
      jsPsychExperiment: { parameters: definitions },
    }),
    definitions
  );
  assert.deepEqual(assetParameterDefinitions({ runtimeType: 'P5' }), []);
  assert.deepEqual(assetParameterDefinitions({}), []);
});

test('a copy keeps the runtime and the pinned asset', () => {
  assert.deepEqual(
    runtimeAssetVariables({
      runtimeType: 'JSPSYCH',
      jsPsychExperiment: { id: 'version-3' },
    }),
    {
      runtimeType: 'JSPSYCH',
      templateRelation: undefined,
      visualRelation: undefined,
      jsPsychExperimentRelation: { connect: { id: 'version-3' } },
    }
  );
  assert.deepEqual(runtimeAssetVariables({ templateId: 't1' }), {
    runtimeType: 'LABJS',
    templateRelation: { connect: { id: 't1' } },
    visualRelation: undefined,
    jsPsychExperimentRelation: undefined,
  });
  assert.deepEqual(
    runtimeAssetVariables({ runtimeType: 'P5', visual: { id: 'v1' } })
      .visualRelation,
    { connect: { id: 'v1' } }
  );
});

test('a task without its asset sends no relation at all', () => {
  const variables = runtimeAssetVariables({ runtimeType: 'JSPSYCH' });
  assert.equal(JSON.stringify(variables), '{"runtimeType":"JSPSYCH"}');
});
