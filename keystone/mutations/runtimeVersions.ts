// Moving a jsPsych block to a newer version of its experiment (D11, W35).
//
// A Task stays on the version it was added with; newer uploads in the same
// family only show up as a notice. Updating repoints the Task and merges its
// parameters by name (mergeParameters). It is refused while any study whose
// flow uses the Task is collecting data, so one dataset never mixes
// versions; the researcher duplicates the study or the block instead.
//
// Newer versions are usually private uploads the researcher can't read, so
// versions are looked up with sudo, after checking the caller can see (or
// edit) the Task itself.

import { permissions } from "../access";

const {
  mergeParameters,
  studyFlowUsesTask,
} = require("../lib/runtime/runtimeCore");

const TASK_QUERY = `
  id
  runtimeType
  parameters
  author { id }
  collaborators { id }
  jsPsychExperiment { id title version family parameters }
`;

const VERSION_QUERY = "id title version parameters createdAt";

// Studies collecting data, cached briefly for the notice: every open jsPsych
// block panel asks for its status. The update itself always reads them fresh,
// so the lock can't be slipped past during the cache window.
const COLLECTING_CACHE_MS = 15 * 1000;
let collectingCache: { at: number; studies: any[] } | null = null;

async function collectingStudies(context: any, { fresh = false } = {}) {
  if (!fresh && collectingCache && Date.now() - collectingCache.at < COLLECTING_CACHE_MS) {
    return collectingCache.studies;
  }
  const studies = await context.sudo().query.Study.findMany({
    where: { status: { equals: "COLLECTING_DATA" } },
    query: "id title flow",
  });
  collectingCache = { at: Date.now(), studies };
  return studies;
}

async function versionContext(
  context: any,
  taskId: string,
  { fresh = false } = {},
) {
  const visible = await context.query.Task.findOne({
    where: { id: taskId },
    query: "id",
  });
  if (!visible) throw new Error("Task was not found");
  const task = await context.sudo().query.Task.findOne({
    where: { id: taskId },
    query: TASK_QUERY,
  });
  if (task?.runtimeType !== "JSPSYCH" || !task.jsPsychExperiment) {
    throw new Error("Only jsPsych blocks have versions");
  }
  const current = task.jsPsychExperiment;
  const [latest] = await context.sudo().query.JsPsychExperiment.findMany({
    where: { family: { equals: current.family || current.id } },
    orderBy: [{ createdAt: "desc" }],
    take: 1,
    query: VERSION_QUERY,
  });
  const collecting = await collectingStudies(context, { fresh });
  const lockingStudies = collecting
    .filter((study: any) => studyFlowUsesTask(study.flow, task.id))
    .map((study: any) => study.title || study.id);

  const userId = context.session?.itemId;
  const canEdit =
    !!userId &&
    // canAccessAdminUI comes from the generated permission list, which the
    // permissions object's type doesn't spell out.
    ((permissions as any).canAccessAdminUI({ session: context.session }) ||
      String(task.author?.id) === String(userId) ||
      (task.collaborators || []).some(
        (profile: any) => String(profile.id) === String(userId),
      ));

  return { task, current, latest: latest || current, lockingStudies, canEdit };
}

function describe({ task, current, latest, lockingStudies, canEdit }: any) {
  const isLatest = String(latest.id) === String(current.id);
  const changes = isLatest
    ? { added: [], removed: [], reset: [] }
    : mergeParameters(task.parameters, current.parameters, latest.parameters);
  return {
    currentVersionId: current.id,
    currentVersion: current.version || null,
    latestVersionId: latest.id,
    latestVersion: latest.version || null,
    latestTitle: latest.title || null,
    isLatest,
    locked: lockingStudies.length > 0,
    lockingStudies,
    canUpdate: canEdit && !isLatest && lockingStudies.length === 0,
    changes: {
      added: changes.added,
      removed: changes.removed,
      reset: changes.reset,
    },
  };
}

export async function runtimeVersionStatus(
  _root: unknown,
  { taskId }: { taskId: string },
  context: any,
) {
  return describe(await versionContext(context, taskId));
}

export async function updateTaskRuntimeVersion(
  _root: unknown,
  { taskId }: { taskId: string },
  context: any,
) {
  const state = await versionContext(context, taskId, { fresh: true });
  if (!state.canEdit) {
    throw new Error("Only the block's author or a collaborator can update it");
  }
  const status = describe(state);
  if (status.isLatest) return status;
  if (status.locked) {
    throw new Error(
      `This block is in a study that is collecting data (${state.lockingStudies.join(
        ", ",
      )}). Duplicate the study or the block to use the new version.`,
    );
  }
  const merged = mergeParameters(
    state.task.parameters,
    state.current.parameters,
    state.latest.parameters,
  );
  await context.sudo().query.Task.updateOne({
    where: { id: taskId },
    data: {
      jsPsychExperiment: { connect: { id: state.latest.id } },
      parameters: merged.parameters,
    },
  });
  return describe(await versionContext(context, taskId));
}
