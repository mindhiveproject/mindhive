const test = require('node:test');
const assert = require('node:assert/strict');
const { isStudyLocked } = require('./studyLock');

test('a submitted study is locked', () => {
  assert.equal(isStudyLocked({ dataCollectionStatus: 'SUBMITTED' }), true);
});

test('a study in any other status is editable', () => {
  for (const status of ['NOT_STARTED', 'IN_PROGRESS', 'FINISHED']) {
    assert.equal(isStudyLocked({ dataCollectionStatus: status }), false, status);
  }
  assert.equal(isStudyLocked({}), false);
});

test('a missing study (still loading, or new) is editable', () => {
  assert.equal(isStudyLocked(undefined), false);
  assert.equal(isStudyLocked(null), false);
});

test('cloning a submitted study is not locked', () => {
  assert.equal(
    isStudyLocked({ dataCollectionStatus: 'SUBMITTED' }, { isClone: true }),
    false
  );
});
