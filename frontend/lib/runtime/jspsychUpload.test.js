const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');
const JSZip = require('jszip');
const { createJsPsychUploadHandler } = require('./jspsychUploadHandler');
const { unpackJsPsychArchive } = require('./jspsychArchive');

const ENTRY =
  '<!doctype html><html><head><script src="task.js"></script></head><body></body></html>';
const TASK = 'initJsPsych().run([{ type: jsPsychHtmlKeyboardResponse }]);';
const PARAMETERS = [{ name: 'trials', type: 'number', value: 3 }];

async function zipOf(files) {
  const zip = new JSZip();
  for (const [name, content] of Object.entries(files)) zip.file(name, content);
  return zip.generateAsync({ type: 'nodebuffer' });
}

function setup({
  roles = ['TESTER'],
  signedIn = true,
  createError,
  assetRoot,
} = {}) {
  const root =
    assetRoot || fs.mkdtempSync(path.join(os.tmpdir(), 'mh-upload-'));
  const calls = { created: [], deleted: [] };
  const handler = createJsPsychUploadHandler({
    assetRoot: root,
    maxBytes: 1024 * 1024,
    graphql: async (query, variables, cookie) => {
      if (query.includes('authenticatedItem')) {
        assert.equal(cookie, 'keystonejs-session=abc');
        return {
          authenticatedItem: signedIn
            ? { id: 'p1', permissions: roles.map((name) => ({ name })) }
            : null,
        };
      }
      if (query.includes('deleteJsPsychExperiment'))
        calls.deleted.push(variables.id);
      return {};
    },
    createVersion: async ({ data, zip, cookie }) => {
      if (createError) throw new Error(createError);
      calls.created.push({ data, size: zip.length, cookie });
      return { id: 'version9', family: '' };
    },
  });
  return { handler, calls, root };
}

async function post(handler, body, query = { title: 'Reaction time' }) {
  const req = Readable.from([body]);
  Object.assign(req, {
    method: 'POST',
    query,
    headers: { cookie: 'keystonejs-session=abc' },
  });
  const res = {
    statusCode: 200,
    body: undefined,
    setHeader() {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    end() {
      return this;
    },
  };
  await handler(req, res);
  return res;
}

test('mindhive.json gives the version its parameters', async () => {
  const { config } = await unpackJsPsychArchive(
    await zipOf({
      'index.html': ENTRY,
      'task.js': TASK,
      'mindhive.json': JSON.stringify({ parameters: PARAMETERS }),
    })
  );
  assert.deepEqual(config.parameters, PARAMETERS);
  const without = await unpackJsPsychArchive(
    await zipOf({ 'index.html': ENTRY, 'task.js': TASK })
  );
  assert.deepEqual(without.config.parameters, []);
});

test('a broken mindhive.json is refused with the reason', async () => {
  const refused = async (content) => {
    try {
      await unpackJsPsychArchive(
        await zipOf({
          'index.html': ENTRY,
          'task.js': TASK,
          'mindhive.json': content,
        })
      );
    } catch (error) {
      return error.problems;
    }
    return [];
  };
  assert.match((await refused('{ nope'))[0], /not valid JSON/);
  assert.match((await refused('[]'))[0], /JSON object/);
  assert.match((await refused('{"parameters": {}}'))[0], /must be a list/);
  assert.match((await refused('{"parameters": [{}]}'))[0], /needs a "name"/);
  assert.match(
    (await refused('{"parameters": [{"name":"a"},{"name":"a"}]}'))[0],
    /listed twice/
  );
});

test('an ADMIN or TESTER upload creates the version and stores its files', async () => {
  const { handler, calls, root } = setup();
  const zip = await zipOf({
    'index.html': ENTRY,
    'task.js': TASK,
    'mindhive.json': JSON.stringify({ parameters: PARAMETERS }),
  });
  const res = await post(handler, zip, {
    title: '  Reaction time ',
    description: 'Press keys',
    family: 'family1',
  });
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, {
    id: 'version9',
    family: 'version9',
    entryPoint: 'index.html',
    plugins: ['html-keyboard-response'],
    parameters: PARAMETERS,
    files: 3,
  });
  const [created] = calls.created;
  assert.equal(created.size, zip.length);
  assert.equal(created.cookie, 'keystonejs-session=abc');
  assert.equal(created.data.title, 'Reaction time');
  assert.equal(created.data.family, 'family1');
  assert.deepEqual(created.data.parameters, PARAMETERS);
  assert.deepEqual(created.data.manifest.files, [
    'index.html',
    'mindhive.json',
    'task.js',
  ]);
  assert.ok(fs.existsSync(path.join(root, 'version9', 'files', 'task.js')));
});

test('uploads need a session, the role, a title and a small enough zip', async () => {
  const zip = await zipOf({ 'index.html': ENTRY, 'task.js': TASK });
  assert.equal(
    (await post(setup({ signedIn: false }).handler, zip)).statusCode,
    401
  );
  assert.equal(
    (await post(setup({ roles: ['STUDENT'] }).handler, zip)).statusCode,
    403
  );
  assert.equal((await post(setup().handler, zip, {})).statusCode, 400);
  const big = await post(setup().handler, Buffer.alloc(2 * 1024 * 1024));
  assert.equal(big.statusCode, 413);
});

test('a refused archive lists every problem and creates nothing', async () => {
  const { handler, calls } = setup();
  const res = await post(
    handler,
    await zipOf({ 'start.html': ENTRY, 'lib/jspsych.js': 'x' })
  );
  assert.equal(res.statusCode, 422);
  assert.equal(res.body.problems.length, 2);
  assert.deepEqual(calls.created, []);
});

test('a Keystone refusal is passed back to the uploader', async () => {
  const { handler } = setup({
    createError:
      'Only an author or collaborator of this experiment can add a version.',
  });
  const res = await post(
    handler,
    await zipOf({ 'index.html': ENTRY, 'task.js': TASK })
  );
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /author or collaborator/);
});

test('when the files cannot be stored, the new version is deleted again', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-upload-'));
  fs.mkdirSync(path.join(root, 'version9'));
  const { handler, calls } = setup({ assetRoot: root });
  const res = await post(
    handler,
    await zipOf({ 'index.html': ENTRY, 'task.js': TASK })
  );
  assert.equal(res.statusCode, 500);
  assert.deepEqual(calls.deleted, ['version9']);
});
