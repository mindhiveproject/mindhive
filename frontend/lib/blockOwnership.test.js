const test = require('node:test');
const assert = require('node:assert/strict');
const { blockRelation } = require('./blockOwnership');

test("a block is the user's own, shared with them, or neither", () => {
  const task = { author: { id: 'a' }, collaborators: [{ id: 'c' }] };
  assert.equal(blockRelation(task, 'a'), 'author');
  assert.equal(blockRelation(task, 'c'), 'collaborator');
  assert.equal(blockRelation(task, 'x'), null);
  assert.equal(blockRelation(task, null), null);
  assert.equal(
    blockRelation({ author: { id: 'a' }, collaborators: [{ id: 'a' }] }, 'a'),
    'author'
  );
  assert.equal(blockRelation({ author: null }, 'a'), null);
});
