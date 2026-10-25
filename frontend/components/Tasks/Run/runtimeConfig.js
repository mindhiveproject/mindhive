// The participant-side copy of keystone/lib/runtime/runtimeCore.js's
// resolveRuntimeConfiguration. The two packages deploy separately, so the
// rules are duplicated rather than imported; runtimeConfig.test.js runs both
// against the same cases and fails if they drift.

const RUNTIME_ASSET_FIELDS = {
  LABJS: 'template',
  P5: 'visual',
  JSPSYCH: 'jsPsychExperiment',
};

function isSafeArchivePath(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 1024 &&
    !value.startsWith('/') &&
    !value.includes('\\') &&
    !value.includes('\0') &&
    value
      .split('/')
      .every((segment) => segment && segment !== '.' && segment !== '..')
  );
}

function validateJsPsychManifest(manifest, entryPoint) {
  if (
    !manifest ||
    typeof manifest !== 'object' ||
    Array.isArray(manifest) ||
    !Array.isArray(manifest.files) ||
    manifest.files.length === 0 ||
    manifest.files.length > 10000 ||
    !manifest.files.every(isSafeArchivePath) ||
    !isSafeArchivePath(entryPoint)
  ) {
    throw new Error('jsPsych manifest contains invalid archive paths');
  }
  if (!manifest.files.includes(entryPoint)) {
    throw new Error('jsPsych entry point must be declared in manifest.files');
  }
}

function resolveRuntimeConfiguration(task) {
  const runtimeType = task?.runtimeType || 'LABJS';
  const assetField = RUNTIME_ASSET_FIELDS[runtimeType];
  if (!assetField) throw new Error(`Unsupported runtime type: ${runtimeType}`);

  const configured = Object.entries(RUNTIME_ASSET_FIELDS)
    .filter(([, field]) => Boolean(task?.[field]))
    .map(([type]) => type);
  if (configured.length !== 1 || configured[0] !== runtimeType) {
    throw new Error(
      `Task runtime ${runtimeType} requires exactly one ${assetField} asset`
    );
  }

  const asset = task[assetField];
  if (runtimeType === 'JSPSYCH') {
    if (!asset.archive?.filename || !asset.entryPoint || !asset.manifest) {
      throw new Error(
        'jsPsych assets require an archive, manifest, and entry point'
      );
    }
    validateJsPsychManifest(asset.manifest, asset.entryPoint);
  }

  return {
    runtimeType,
    assetField,
    asset,
    assetVersion:
      runtimeType === 'JSPSYCH' ? String(asset.id) : asset.version || '1',
  };
}

module.exports = {
  RUNTIME_ASSET_FIELDS,
  isSafeArchivePath,
  resolveRuntimeConfiguration,
};
