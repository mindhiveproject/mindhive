import { participantForRun } from "./runtimeRuns";

function connect(id?: string | null) {
  return id ? { connect: { id } } : undefined;
}

const STUDY_QUERY =
  "id author { id } collaborators { id } participants { id }";

/**
 * Upserts the calling participant's StudyDataSourceRecord for one study: the
 * AggregateRecorder's running `steps`/`session` snapshots, sent whenever a
 * step closes and once more when the participant finishes or leaves.
 * Authenticated the same way the rest of the participant-facing API is
 * (session cookie, or `guestPublicId` checked against the study's guest
 * list) — this runs in the same React tree as everything else in
 * Studies/Run, never inside a sandboxed task iframe, so it doesn't need the
 * signed runToken relay Dataset's runtime messages use.
 */
export async function saveStudyDataSourceRecord(
  _root: unknown,
  {
    studyId,
    guestPublicId,
    steps,
    session,
  }: {
    studyId: string;
    guestPublicId?: string | null;
    steps: any;
    session: any;
  },
  context: any,
) {
  const study = await context.sudo().query.Study.findOne({
    where: { id: studyId },
    query: STUDY_QUERY,
  });
  if (!study) throw new Error("Study was not found");

  const participant = await participantForRun(context, study, guestPublicId);

  const existing = await context.sudo().query.StudyDataSourceRecord.findMany({
    where: {
      study: { id: { equals: studyId } },
      ...(participant.profileId
        ? { profile: { id: { equals: participant.profileId } } }
        : { guest: { id: { equals: participant.guestId } } }),
    },
    query: "id",
  });

  const data = {
    study: connect(studyId),
    profile: connect(participant.profileId),
    guest: connect(participant.guestId),
    type: participant.type,
    steps: steps ?? [],
    session: session ?? [],
  };

  if (existing[0]?.id) {
    await context.sudo().query.StudyDataSourceRecord.updateOne({
      where: { id: existing[0].id },
      data,
    });
    return existing[0].id;
  }

  const created = await context.sudo().query.StudyDataSourceRecord.createOne({
    data,
    query: "id",
  });
  return created.id;
}
