const test = require('node:test');
const assert = require('node:assert/strict');
const { flattenRuntimeRow } = require('./flattenRow');

test('jsPsych survey answers become one column each', () => {
  assert.deepEqual(
    flattenRuntimeRow(
      {
        trial_type: 'survey-text',
        rt: 1200,
        response: { Q0: 'tired', Q1: 'yes' },
        order: [2, 0, 1],
      },
      'JSPSYCH'
    ),
    {
      trial_type: 'survey-text',
      rt: 1200,
      'response.Q0': 'tired',
      'response.Q1': 'yes',
      order: '[2,0,1]',
    }
  );
});

test('p5 marker values flatten; empty objects and deep values stay readable', () => {
  assert.deepEqual(
    flattenRuntimeRow(
      {
        mh_kind: 'marker',
        label: 'response',
        value: { trial: 1, rt: 300 },
        extra: {},
      },
      'P5'
    ),
    {
      mh_kind: 'marker',
      label: 'response',
      'value.trial': 1,
      'value.rt': 300,
      extra: '',
    }
  );
  // Five levels below the column are flattened; anything deeper stays JSON.
  const deep = { a: { b: { c: { d: { e: { f: { g: 1 } } } } } } };
  assert.deepEqual(flattenRuntimeRow(deep, 'JSPSYCH'), {
    'a.b.c.d.e.f': '{"g":1}',
  });
});

test('Lab.js rows are exported unchanged', () => {
  const row = { sender: 'Trial', meta: { a: 1 } };
  assert.equal(flattenRuntimeRow(row, 'LABJS'), row);
  assert.equal(flattenRuntimeRow(row, undefined), row);
});

test('a task field named like a metadata column is kept under data.', () => {
  assert.deepEqual(
    flattenRuntimeRow(
      { task: 'response', rt: 300, id: 7, response: { task: 'x' } },
      'JSPSYCH',
      ['task', 'id', 'payload']
    ),
    { 'data.task': 'response', rt: 300, 'data.id': 7, 'response.task': 'x' }
  );
  const labJs = { task: 'kept as before' };
  assert.equal(flattenRuntimeRow(labJs, 'LABJS', ['task']), labJs);
});
