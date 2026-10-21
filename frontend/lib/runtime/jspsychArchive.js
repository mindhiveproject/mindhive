// Turns an uploaded jsPsych archive into the files the task route serves
// (W28). Archives are unpacked once, at upload, into a directory per version:
//
//   runtime-assets/jspsych/<version id>/manifest.json
//   runtime-assets/jspsych/<version id>/files/<archive paths>
//
// A version's directory is never rewritten: a new upload is a new version.
//
// Upload also enforces the envelope (D4): jsPsych and its plugins come from
// MindHive, so an archive that bundles or CDN-loads its own copy is refused,
// and so is one that uses a plugin MindHive doesn't serve.

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const {
  isSafeArchivePath,
} = require('../../components/Tasks/Run/runtimeConfig');
const {
  EXCLUDED_PLUGINS,
  JSPSYCH_VERSION,
  PLUGINS,
  pluginsUsedIn,
} = require('./jspsychEnvelope');

const MAX_FILES = 10000;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_TOTAL_BYTES = 200 * 1024 * 1024;
const SCANNED = /\.(html?|m?js)$/i;
const IGNORED = /(^|\/)(__MACOSX\/|\.DS_Store$|Thumbs\.db$)/;

class ArchiveError extends Error {
  constructor(problems) {
    super(problems.join(' '));
    this.name = 'ArchiveError';
    this.problems = problems;
  }
}

// A zip made by zipping a folder puts everything under that folder's name.
function commonRoot(paths) {
  const first = paths[0]?.split('/')[0];
  if (!first || paths.some((p) => !p.startsWith(`${first}/`))) return '';
  return `${first}/`;
}

function isSymlink(entry) {
  const mode = entry.unixPermissions;
  // The file-type bits of a Unix mode; 0o120000 is a symbolic link.
  // eslint-disable-next-line no-bitwise
  return typeof mode === 'number' && (mode & 0o170000) === 0o120000;
}

function pluginGlobals(names) {
  return names.map(
    (name) =>
      `jsPsych${name
        .split('-')
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join('')}`
  );
}

/** Problems with how an archive uses jsPsych, as messages for the uploader. */
function envelopeProblems(paths, texts) {
  const problems = [];
  // Only plugin-style names: an experiment's own instructions.js or
  // preload.js is fine.
  const pluginFile = new RegExp(
    `(^|/)(jspsych-)?plugin-(${[
      ...Object.keys(PLUGINS),
      ...EXCLUDED_PLUGINS,
    ].join('|')})(\\.min)?\\.js$|(^|/)jspsych-(${[
      ...Object.keys(PLUGINS),
      ...EXCLUDED_PLUGINS,
    ].join('|')})(\\.min)?\\.js$`,
    'i'
  );
  for (const file of paths) {
    if (
      /(^|\/)jspsych(\.(min|umd|browser))*\.js$/i.test(file) ||
      /(^|\/)(@jspsych|jspsych\/dist)\//i.test(file) ||
      pluginFile.test(file)
    ) {
      problems.push(
        `${file} looks like a copy of jsPsych or a plugin; MindHive provides jsPsych ${JSPSYCH_VERSION} and its plugins.`
      );
    }
  }
  for (const [file, text] of Object.entries(texts)) {
    if (
      /\.html?$/i.test(file) &&
      /<script[^>]+src=["'](https?:)?\/\/[^"']*jspsych/i.test(text)
    ) {
      problems.push(
        `${file} loads jsPsych from a CDN; remove that script tag, MindHive adds jsPsych ${JSPSYCH_VERSION}.`
      );
    }
    if (
      /\.m?js$/i.test(file) &&
      (/\bclass\s+JsPsych\b/.test(text) ||
        /\bfunction\s+initJsPsych\s*\(/.test(text) ||
        /\bjsPsychModule\s*=/.test(text))
    ) {
      problems.push(
        `${file} bundles its own jsPsych; build it with jsPsych as an external, MindHive adds jsPsych ${JSPSYCH_VERSION}.`
      );
    }
  }
  const allText = Object.values(texts).join('\n');
  const excluded = EXCLUDED_PLUGINS.filter((name, i) =>
    new RegExp(`\\b${pluginGlobals(EXCLUDED_PLUGINS)[i]}\\b`).test(allText)
  );
  if (excluded.length) {
    problems.push(
      `This experiment uses ${excluded
        .map((name) => `@jspsych/plugin-${name}`)
        .join(
          ', '
        )}, which MindHive can't serve: task frames have no camera, microphone or eye tracker.`
    );
  }
  return problems;
}

/**
 * Reads and checks an archive.
 *
 * @param {Buffer} buffer - The zip file.
 * @param {{entryPoint?: string}} [options] - Defaults to index.html.
 * @returns {Promise<{files: Array<{path: string, data: Buffer}>, manifest: object}>}
 * @throws {ArchiveError} listing every problem found.
 */
async function unpackJsPsychArchive(
  buffer,
  { entryPoint = 'index.html' } = {}
) {
  let zip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new ArchiveError(['The file is not a readable zip archive.']);
  }
  const entries = Object.values(zip.files).filter(
    (entry) => !entry.dir && !IGNORED.test(entry.name)
  );
  if (entries.length === 0) throw new ArchiveError(['The archive is empty.']);
  if (entries.length > MAX_FILES) {
    throw new ArchiveError([`The archive has more than ${MAX_FILES} files.`]);
  }

  const root = commonRoot(entries.map((entry) => entry.name));
  const problems = [];
  const files = [];
  const texts = {};
  let totalBytes = 0;
  const unsafe = entries.filter(
    (entry) =>
      !isSafeArchivePath(entry.name.slice(root.length)) || isSymlink(entry)
  );
  problems.push(
    ...unsafe.map(
      (entry) => `${entry.name} is not a safe path inside the archive.`
    )
  );
  for (const entry of entries.filter((item) => !unsafe.includes(item))) {
    const file = entry.name.slice(root.length);
    // Checked before inflating, where the zip says; counted again after.
    // eslint-disable-next-line no-underscore-dangle
    const declared = entry._data?.uncompressedSize;
    if (
      declared > MAX_FILE_BYTES ||
      totalBytes + (declared || 0) > MAX_TOTAL_BYTES
    ) {
      throw new ArchiveError([
        `The archive is too large: files are limited to ${
          MAX_FILE_BYTES / 1024 / 1024
        } MB each and ${MAX_TOTAL_BYTES / 1024 / 1024} MB in all.`,
      ]);
    }
    const data = await entry.async('nodebuffer');
    totalBytes += data.length;
    if (data.length > MAX_FILE_BYTES || totalBytes > MAX_TOTAL_BYTES) {
      throw new ArchiveError([
        `The archive is too large: files are limited to ${
          MAX_FILE_BYTES / 1024 / 1024
        } MB each and ${MAX_TOTAL_BYTES / 1024 / 1024} MB in all.`,
      ]);
    }
    files.push({ path: file, data });
    if (SCANNED.test(file)) texts[file] = data.toString('utf8');
  }

  const paths = files.map((f) => f.path);
  if (!/\.html?$/i.test(entryPoint) || !paths.includes(entryPoint)) {
    problems.push(`The archive needs an HTML entry point at ${entryPoint}.`);
  }
  problems.push(...envelopeProblems(paths, texts));
  if (problems.length) throw new ArchiveError(problems);

  return {
    files,
    manifest: {
      files: paths.sort(),
      entryPoint,
      jsPsychVersion: JSPSYCH_VERSION,
      plugins: pluginsUsedIn(Object.values(texts)),
      totalBytes,
    },
  };
}

function versionDirectory(assetRoot, versionId) {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(String(versionId))) {
    throw new Error('Invalid jsPsych version id');
  }
  return path.join(assetRoot, String(versionId));
}

/**
 * Writes an unpacked archive for one version. Refuses a version that already
 * has files: versions are immutable. Writes to a temporary directory and
 * renames it into place, so a half-written version is never served.
 */
async function storeUnpackedArchive(assetRoot, versionId, { files, manifest }) {
  const target = versionDirectory(assetRoot, versionId);
  if (fs.existsSync(target)) {
    throw new Error(`jsPsych version ${versionId} is already stored`);
  }
  await fs.promises.mkdir(assetRoot, { recursive: true });
  const staging = await fs.promises.mkdtemp(
    path.join(assetRoot, `.${versionId}-`)
  );
  try {
    for (const file of files) {
      const destination = path.join(staging, 'files', file.path);
      await fs.promises.mkdir(path.dirname(destination), { recursive: true });
      await fs.promises.writeFile(destination, file.data);
    }
    await fs.promises.writeFile(
      path.join(staging, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    await fs.promises.rename(staging, target);
  } catch (error) {
    await fs.promises.rm(staging, { recursive: true, force: true });
    throw error;
  }
  return target;
}

async function readStoredManifest(assetRoot, versionId) {
  const file = path.join(
    versionDirectory(assetRoot, versionId),
    'manifest.json'
  );
  return JSON.parse(await fs.promises.readFile(file, 'utf8'));
}

module.exports = {
  ArchiveError,
  readStoredManifest,
  storeUnpackedArchive,
  unpackJsPsychArchive,
  versionDirectory,
};
