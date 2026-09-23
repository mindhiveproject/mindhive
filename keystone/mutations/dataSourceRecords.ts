import { participantForRun } from "./runtimeRuns";

function connect(id?: string | null) {
  return id ? { connect: { id } } : undefined;
}

const STUDY_QUERY =
  "id author { id } collaborators { id } participants { id }";

/**
 * Folds a client snapshot into what's already stored, keyed per window.
 *
 * A save is never a delta *within* one recorder — the client always sends that
 * recorder's full running list, so an entry it sends again replaces the stored
 * copy and the save stays idempotent. But a participation spans several
 * recorders, because the study runner reloads the page between tasks, and a
 * fresh recorder knows nothing about the windows saved before the reload.
 * Keying on the recorder's own `segmentId` keeps both true at once: re-sent
 * windows overwrite, windows from an earlier segment survive.
 */
function mergeWindows(
  stored: unknown,
  incoming: unknown,
  keyOf: (entry: any) => string,
) {
  const base = Array.isArray(stored) ? stored : [];
  const next = Array.isArray(incoming) ? incoming : [];
  const replaced = new Set(next.map(keyOf));
  return [...base.filter((entry) => !replaced.has(keyOf(entry))), ...next];
}

const stepKey = (entry: any) =>
  `${entry?.segmentId}|${entry?.sourceId}|${entry?.stepId}`;
const sessionKey = (entry: any) => `${entry?.segmentId}|${entry?.sourceId}`;

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
    query: "id steps session",
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
      data: {
        ...data,
        steps: mergeWindows(existing[0].steps, steps, stepKey),
        session: mergeWindows(existing[0].session, session, sessionKey),
      },
    });
    return existing[0].id;
  }

  const created = await context.sudo().query.StudyDataSourceRecord.createOne({
    data,
    query: "id",
  });
  return created.id;
}
