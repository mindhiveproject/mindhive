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

function resolveRuntimeConfiguration(task) {
  const runtimeType = task?.runtimeType || 'LABJS';
  const assetField = RUNTIME_ASSET_FIELDS[runtimeType];
  if (!assetField) throw new Error(`Unsupported runtime type: ${runtimeType}`);
  const configured = Object.values(RUNTIME_ASSET_FIELDS).filter((field) =>
    Boolean(task?.[field])
  );
  if (configured.length !== 1 || !task?.[assetField]) {
    throw new Error(
      `Task runtime ${runtimeType} requires exactly one ${assetField} asset`
    );
  }
  if (runtimeType === 'JSPSYCH') {
    const asset = task.jsPsychExperiment;
    if (!asset.archive?.filename || !asset.entryPoint || !asset.manifest) {
      throw new Error(
        'jsPsych assets require an archive, manifest, and entry point'
      );
    }
    if (
      !Array.isArray(asset.manifest.files) ||
      !asset.manifest.files.every(isSafeArchivePath) ||
      !isSafeArchivePath(asset.entryPoint) ||
      !asset.manifest.files.includes(asset.entryPoint)
    ) {
      throw new Error('jsPsych entry point must be declared in manifest.files');
    }
  }
  return { runtimeType, assetField, asset: task[assetField] };
}

module.exports = { RUNTIME_ASSET_FIELDS, resolveRuntimeConfiguration };
