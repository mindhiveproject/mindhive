// Makes the signed-in user's own copy of a task: same content, parameters and
// runtime (template, visual or jsPsych version, which stay shared), private,
// and authored by the caller (Task.author is always the session user).
//
// Used by copyTaskForStudy (a study block's copy) and by the sharing
// mutations (a copy someone shared with you). Each says how consent and the
// link back to the source are handled.

export type CopyTaskOptions = {
  // "ifOwner": keep the source's consent when the caller owns the source.
  // "never": the copy starts without any consent.
  consent: "ifOwner" | "never";
  // Point `copiedFrom` at the original (a study's private copy). Shared
  // copies leave it empty: the banks hide copies that have it.
  linkToOriginal: boolean;
  // Settings for the copy, from the source's settings.
  settings?: (sourceSettings: any) => any;
  // Also add the copy to this profile's favorites.
  favoriteOf?: string;
};

export const TASK_COPY_QUERY = `
  id
  title
  i18nContent
  taskType
  runtimeType
  description
  descriptionForParticipants
  parameters
  settings
  aggregateVariables
  link
  isExternal
  image
  largeImage
  template { id }
  visual { id }
  jsPsychExperiment { id }
  copiedFrom { id }
  author { id }
  collaborators { id }
  consent { id }
`;

export async function copyTask(
  context: any,
  sourceId: string,
  options: CopyTaskOptions
) {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in to do this.");
  }

  const source = await context.sudo().query.Task.findOne({
    where: { id: String(sourceId) },
    query: TASK_COPY_QUERY,
  });
  if (!source) {
    throw new Error("Task not found.");
  }

  const userId = String(session.itemId);
  const ownsSource =
    String(source.author?.id) === userId ||
    (source.collaborators || []).some((c: any) => String(c?.id) === userId);
  const keepConsent =
    options.consent === "ifOwner" && ownsSource && source.consent?.length;

  const connect = (relation: any) =>
    relation?.id ? { connect: { id: relation.id } } : undefined;

  return context.db.Task.createOne({
    data: {
      title: source.title,
      i18nContent: source.i18nContent,
      taskType: source.taskType,
      runtimeType: source.runtimeType,
      description: source.description,
      descriptionForParticipants: source.descriptionForParticipants,
      parameters: source.parameters,
      settings: options.settings
        ? options.settings(source.settings)
        : source.settings,
      aggregateVariables: source.aggregateVariables,
      link: source.link,
      isExternal: source.isExternal,
      image: source.image,
      largeImage: source.largeImage,
      template: connect(source.template),
      visual: connect(source.visual),
      jsPsychExperiment: connect(source.jsPsychExperiment),
      ...(options.linkToOriginal
        ? { copiedFrom: { connect: { id: source.copiedFrom?.id || source.id } } }
        : {}),
      ...(keepConsent
        ? { consent: { connect: source.consent.map((c: any) => ({ id: c.id })) } }
        : {}),
      ...(options.favoriteOf
        ? { favoriteBy: { connect: [{ id: String(options.favoriteOf) }] } }
        : {}),
    },
  });
}
