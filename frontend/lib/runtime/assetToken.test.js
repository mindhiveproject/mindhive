const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyAssetToken } = require('./assetToken');
// eslint-disable-next-line import/no-relative-packages
const server = require('../../../keystone/lib/runtime/runtimeCore');

test('the frontend accepts the asset tokens Keystone signs', () => {
  const token = server.signAssetToken('version-7', 'shared', 1000);
  assert.equal(verifyAssetToken(token, 'shared', 2000).assetId, 'version-7');
  assert.throws(() => verifyAssetToken(token, 'other', 2000), /Invalid/);
  assert.throws(
    () => verifyAssetToken(token, 'shared', 1000 + 13 * 60 * 60 * 1000),
    /Expired/
  );
});

test('a run token is not an asset token', () => {
  const runToken = server.signRunClaims(
    { datasetId: 'd', datasetToken: 't' },
    'shared',
    1000
  );
  assert.throws(() => verifyAssetToken(runToken, 'shared', 2000), /Invalid/);
  assert.throws(() => verifyAssetToken('', 'shared'), /Invalid/);
  assert.throws(() => verifyAssetToken('a.b', undefined), /Invalid/);
});
