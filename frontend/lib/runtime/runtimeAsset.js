// Which asset a Task runs, as the builder needs it: the parameter definitions
// its editor shows, and the relation a copy must keep.

const RUNTIME_ASSET_RELATIONS = {
  LABJS: 'template',
  P5: 'visual',
  JSPSYCH: 'jsPsychExperiment',
};

function runtimeTypeOf(task) {
  return RUNTIME_ASSET_RELATIONS[task?.runtimeType]
    ? task.runtimeType
    : 'LABJS';
}

/**
 * The parameter definitions a Task's values are edited against, in the
 * Template.parameters format. A p5 visual declares its parameters in code, so
 * it has none here yet.
 */
function assetParameterDefinitions(task) {
  const runtimeType = runtimeTypeOf(task);
  if (runtimeType === 'JSPSYCH')
    return task?.jsPsychExperiment?.parameters || [];
  if (runtimeType === 'P5') return [];
  return task?.template?.parameters || [];
}

/**
 * Variables for CREATE_TASK that connect the new Task to the same runtime and
 * the same pinned asset as `task`. A copy of a jsPsych task keeps the exact
 * version row the original points at (D11). The builder carries a Lab.js
 * template as `templateId`, so that wins over `template.id` when present.
 *
 * Unused relations are left undefined, not null: an unsent variable leaves
 * the field out of the create, where null would be an explicit empty relation.
 */
function runtimeAssetVariables(task) {
  const runtimeType = runtimeTypeOf(task);
  const connect = (id) => (id ? { connect: { id } } : undefined);
  return {
    runtimeType,
    templateRelation:
      runtimeType === 'LABJS'
        ? connect(task?.templateId || task?.template?.id)
        : undefined,
    visualRelation:
      runtimeType === 'P5' ? connect(task?.visual?.id) : undefined,
    jsPsychExperimentRelation:
      runtimeType === 'JSPSYCH'
        ? connect(task?.jsPsychExperiment?.id)
        : undefined,
  };
}

module.exports = { assetParameterDefinitions, runtimeAssetVariables };
