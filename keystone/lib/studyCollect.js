// Data for a study's Collect page (participants, guests and their results),
// checked once per request at the study level.
//
// Through the regular API this page paid for access checks on every row: the
// Dataset read filter on each participant's nested `datasets`, and
// canViewParticipantData / canViewGuestData on each private field of each
// participant. Those per-row lookups made the page slow for everyone but
// admins, and they disagreed with who may work on the study (class staff
// could open the page but saw no results). Here the viewer passes one check —
// they may edit the study (studyUpdateFilter in access.ts) — and the page's
// data is then read in three flat queries, however many participants there are.

const PARTICIPANT_FIELDS =
  "id publicId publicReadableId type info generalInfo studiesInfo";

const DATASET_SELECT = {
  id: true,
  token: true,
  isCompleted: true,
  isIncluded: true,
  studyStatus: true,
  studyVersion: true,
  studyId: true,
  profileId: true,
  guestId: true,
};

// `accessFilter` is the study update filter for the viewer: false when signed
// out, true for admins, otherwise a Study where clause.
function studyGateWhere(studyId, accessFilter) {
  if (!studyId || !accessFilter) return null;
  const byId = { id: { equals: String(studyId) } };
  return accessFilter === true ? byId : { AND: [byId, accessFilter] };
}

function groupDatasetsBy(datasets, key) {
  const groups = new Map();
  for (const dataset of datasets) {
    const ownerId = dataset[key];
    if (!ownerId) continue;
    if (!groups.has(ownerId)) groups.set(ownerId, []);
    groups.get(ownerId).push(dataset);
  }
  return groups;
}

function toDatasetOutput(dataset) {
  return {
    id: dataset.id,
    token: dataset.token,
    isCompleted: !!dataset.isCompleted,
    isIncluded: !!dataset.isIncluded,
    studyStatus: dataset.studyStatus,
    studyVersion: dataset.studyVersion,
    study: dataset.studyId ? { id: dataset.studyId } : null,
  };
}

// Only this study's entry of studiesInfo is returned: the page reads nothing
// else, and the other entries describe studies the viewer may not work on.
function toParticipantOutput(item, studyId, datasets) {
  const studyInfo = item?.studiesInfo?.[studyId];
  return {
    id: item.id,
    publicId: item.publicId,
    publicReadableId: item.publicReadableId,
    type: item.type,
    info: item.info ?? null,
    generalInfo: item.generalInfo ?? null,
    studiesInfo: studyInfo === undefined ? {} : { [studyId]: studyInfo },
    datasets: (datasets || []).map(toDatasetOutput),
  };
}

async function loadStudyCollectData(context, studyId, accessFilter) {
  const where = studyGateWhere(studyId, accessFilter);
  const allowed =
    !!where && (await context.sudo().db.Study.count({ where })) > 0;
  if (!allowed) {
    throw new Error("You do not have access to this study's data.");
  }

  const id = String(studyId);
  const inStudy = { some: { id: { equals: id } } };
  const [profiles, guests, datasets] = await Promise.all([
    context.sudo().query.Profile.findMany({
      where: {
        OR: [
          { participantIn: inStudy },
          { researcherIn: inStudy },
          { collaboratorInStudy: inStudy },
        ],
      },
      query: PARTICIPANT_FIELDS,
    }),
    context.sudo().query.Guest.findMany({
      where: { participantIn: inStudy },
      query: PARTICIPANT_FIELDS,
    }),
    context.prisma.dataset.findMany({
      where: { studyId: id },
      select: DATASET_SELECT,
    }),
  ]);

  const byProfile = groupDatasetsBy(datasets, "profileId");
  const byGuest = groupDatasetsBy(datasets, "guestId");
  return {
    participants: profiles.map((profile) =>
      toParticipantOutput(profile, id, byProfile.get(profile.id))
    ),
    guests: guests.map((guest) =>
      toParticipantOutput(guest, id, byGuest.get(guest.id))
    ),
  };
}

module.exports = {
  studyGateWhere,
  loadStudyCollectData,
};
