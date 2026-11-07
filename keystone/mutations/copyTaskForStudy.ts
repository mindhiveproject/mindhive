// Make the signed-in user's own copy of a task for a study block, so the
// block keeps working the same however the original is edited later.
// The copy points back to the original through `copiedFrom` (a copy of a
// copy points to the same original) and is private. Consent comes along only
// when the user owns the task copied; otherwise it belongs to its author.
async function copyTaskForStudy(
  root: any,
  { id }: { id: string },
  context: any
) {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in to do this.");
  }

  const source = await context.query.Task.findOne({
    where: { id },
    query: `
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
    `,
  });
  if (!source) {
    throw new Error("Task not found.");
  }

  const userId = String(session.itemId);
  const ownsSource =
    String(source.author?.id) === userId ||
    (source.collaborators || []).some((c: any) => String(c?.id) === userId);

  const connect = (relation: any) =>
    relation?.id ? { connect: { id: relation.id } } : undefined;

  const copy = await context.db.Task.createOne({
    data: {
      title: source.title,
      i18nContent: source.i18nContent,
      taskType: source.taskType,
      runtimeType: source.runtimeType,
      description: source.description,
      descriptionForParticipants: source.descriptionForParticipants,
      parameters: source.parameters,
      settings: source.settings,
      aggregateVariables: source.aggregateVariables,
      link: source.link,
      isExternal: source.isExternal,
      image: source.image,
      largeImage: source.largeImage,
      template: connect(source.template),
      visual: connect(source.visual),
      jsPsychExperiment: connect(source.jsPsychExperiment),
      copiedFrom: { connect: { id: source.copiedFrom?.id || source.id } },
      ...(ownsSource && source.consent?.length
        ? { consent: { connect: source.consent.map((c: any) => ({ id: c.id })) } }
        : {}),
    },
  });

  return copy;
}

export default copyTaskForStudy;
