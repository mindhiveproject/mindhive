// POST /api/runtime/upload/jspsych (W14): turns an uploaded zip into a new,
// immutable jsPsych version.
//
// The body is the zip itself; title, description, entryPoint and (to add a
// version to an existing experiment) family come in the query string. The
// steps:
//   1. the caller must be ADMIN or TESTER (D10), checked with their session;
//   2. the archive must pass the upload checks, including the envelope (D4);
//   3. Keystone creates the JsPsychExperiment with the caller's session, so
//      its own access rules and validation apply, and stores the zip;
//   4. the unpacked files are stored for the task route.
// If step 4 fails, the row from step 3 is deleted again, so a version never
// exists without its files.

const {
  ArchiveError,
  storeUnpackedArchive,
  unpackJsPsychArchive,
} = require('./jspsychArchive');

// Matches MAX_TOTAL_BYTES for unpacked files; a zip is never larger.
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
const MANAGER_ROLES = ['ADMIN', 'TESTER'];

const AUTH_QUERY = `
  query RuntimeUploader {
    authenticatedItem {
      ... on Profile {
        id
        permissions {
          name
          canAccessAdminUI
        }
      }
    }
  }
`;

const CREATE_VERSION_MUTATION = `
  mutation CreateJsPsychVersion($data: JsPsychExperimentCreateInput!) {
    createJsPsychExperiment(data: $data) {
      id
      family
    }
  }
`;

const DELETE_VERSION_MUTATION = `
  mutation DeleteJsPsychVersion($id: ID!) {
    deleteJsPsychExperiment(where: { id: $id }) {
      id
    }
  }
`;

function canManage(profile) {
  return (profile?.permissions || []).some(
    (role) => MANAGER_ROLES.includes(role?.name) || role?.canAccessAdminUI
  );
}

function text(value, max) {
  const string = typeof value === 'string' ? value.trim() : '';
  return string.slice(0, max);
}

/** Reads the raw body, refusing it as soon as it passes `maxBytes`. */
function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(Object.assign(new Error('too large'), { code: 'TOO_LARGE' }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * @param {object} deps
 * @param {(query, variables, cookie) => Promise<object>} deps.graphql - A
 *   Keystone call made with the caller's session cookie.
 * @param {(args: {data, zip, filename, cookie}) => Promise<{id, family}>} deps.createVersion -
 *   The GraphQL multipart upload that creates the row with its archive.
 * @param {string} deps.assetRoot - runtime-assets/jspsych.
 * @param {number} [deps.maxBytes]
 */
function createJsPsychUploadHandler({
  graphql,
  createVersion,
  assetRoot,
  maxBytes = MAX_UPLOAD_BYTES,
}) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).end();
    }
    const cookie = req.headers?.cookie || '';

    let profile;
    try {
      profile = (await graphql(AUTH_QUERY, {}, cookie))?.authenticatedItem;
    } catch {
      profile = null;
    }
    if (!profile?.id) {
      return res
        .status(401)
        .json({ error: 'Sign in to upload a jsPsych experiment.' });
    }
    if (!canManage(profile)) {
      return res.status(403).json({
        error: 'Only ADMIN and TESTER accounts can upload jsPsych experiments.',
      });
    }

    const title = text(req.query?.title, 200);
    if (!title) {
      return res.status(400).json({ error: 'The experiment needs a title.' });
    }
    const entryPoint = text(req.query?.entryPoint, 1024) || 'index.html';
    const family = text(req.query?.family, 64) || undefined;

    let zip;
    try {
      zip = await readBody(req, maxBytes);
    } catch (error) {
      if (error.code === 'TOO_LARGE') {
        return res.status(413).json({
          error: `Archives are limited to ${maxBytes / 1024 / 1024} MB.`,
        });
      }
      return res.status(400).json({ error: 'The upload could not be read.' });
    }

    let unpacked;
    try {
      unpacked = await unpackJsPsychArchive(zip, { entryPoint });
    } catch (error) {
      if (error instanceof ArchiveError) {
        return res.status(422).json({
          error: 'The archive was refused.',
          problems: error.problems,
        });
      }
      return res.status(400).json({ error: 'The archive could not be read.' });
    }

    let version;
    try {
      version = await createVersion({
        cookie,
        zip,
        filename: text(req.query?.filename, 200) || 'experiment.zip',
        data: {
          title,
          description: text(req.query?.description, 5000),
          entryPoint: unpacked.manifest.entryPoint,
          manifest: unpacked.manifest,
          parameters: unpacked.config.parameters,
          ...(family ? { family } : {}),
        },
      });
    } catch (error) {
      return res.status(400).json({
        error: error?.message || 'The experiment could not be created.',
      });
    }

    try {
      await storeUnpackedArchive(assetRoot, version.id, unpacked);
    } catch {
      await graphql(DELETE_VERSION_MUTATION, { id: version.id }, cookie).catch(
        () => {}
      );
      return res
        .status(500)
        .json({ error: 'The experiment files could not be stored.' });
    }

    return res.status(201).json({
      id: version.id,
      family: version.family || version.id,
      entryPoint: unpacked.manifest.entryPoint,
      plugins: unpacked.manifest.plugins,
      parameters: unpacked.config.parameters,
      files: unpacked.manifest.files.length,
    });
  };
}

module.exports = {
  CREATE_VERSION_MUTATION,
  MAX_UPLOAD_BYTES,
  createJsPsychUploadHandler,
};
