const test = require('node:test');
const assert = require('node:assert/strict');
const { studyLifecycle } = require('./studyLifecycle');

test('a supervised study reads the milestone status', () => {
  const read = (dataCollectionStatus) =>
    studyLifecycle(
      { dataCollectionStatus, status: 'WORKING' },
      { supervised: true }
    ).stage;
  assert.equal(read('NOT_STARTED'), 'DESIGNING');
  assert.equal(read('IN_PROGRESS'), 'DESIGNING');
  assert.equal(read('SUBMITTED'), 'COLLECTING');
  assert.equal(read('FINISHED'), 'FINISHED');
});

test('a supervised study ignores a self-set label', () => {
  const life = studyLifecycle(
    { dataCollectionStatus: 'IN_PROGRESS', status: 'COLLECTING_DATA' },
    { supervised: true }
  );
  assert.equal(life.stage, 'DESIGNING');
  assert.equal(life.locked, false);
});

test('a self-managed study reads its label and is never locked', () => {
  const read = (status) =>
    studyLifecycle({ status, dataCollectionStatus: 'NOT_STARTED' });
  assert.equal(read('WORKING').stage, 'DESIGNING');
  assert.equal(read('COLLECTING_DATA').stage, 'COLLECTING');
  assert.equal(read('DATA_COLLECTION_IS_COMPLETED').stage, 'FINISHED');
  assert.equal(read('COLLECTING_DATA').locked, false);
});

test('old review labels read as designing and are kept as legacyStatus', () => {
  for (const status of [
    'SUBMITTED_AS_PROPOSAL',
    'READY_FOR_REVIEW',
    'IN_REVIEW',
    'REVIEWED',
  ]) {
    const life = studyLifecycle({ status });
    assert.equal(life.stage, 'DESIGNING', status);
    assert.equal(life.legacyStatus, status);
  }
  assert.equal(studyLifecycle({ status: 'WORKING' }).legacyStatus, null);
});

test('a locked study without a supervising board still reads as locked', () => {
  const life = studyLifecycle({
    dataCollectionStatus: 'SUBMITTED',
    status: 'WORKING',
    dataCollectionOpenForParticipation: true,
  });
  assert.equal(life.stage, 'COLLECTING');
  assert.equal(life.locked, true);
  assert.equal(life.open, true);
});

test('a missing study is a self-managed study being designed', () => {
  const life = studyLifecycle(undefined);
  assert.equal(life.stage, 'DESIGNING');
  assert.equal(life.open, false);
  assert.equal(life.locked, false);
});
