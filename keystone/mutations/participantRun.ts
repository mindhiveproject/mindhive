// Writes made by study participants while they run a study. Participants are
// often anonymous guests and are never owners of the Study, so the generated
// updateStudy / updateGuest mutations are closed to them; these resolvers do
// the narrow write with sudo instead.

const MAX_CONDITION_LABELS = 50;
const MAX_LABEL_LENGTH = 200;

/**
 * Add one to the between-subjects condition counters in Study.components for
 * each condition this participant was assigned to. The counts drive weighted
 * random assignment (Studies/Run/Manager.js selectCondition).
 */
export async function recordStudyConditions(
  root: any,
  { studyId, conditionLabels }: { studyId: string; conditionLabels: string[] },
  context: any
): Promise<boolean> {
  const labels = (conditionLabels || []).filter(
    (label) =>
      typeof label === "string" &&
      label.length > 0 &&
      label.length <= MAX_LABEL_LENGTH
  );
  if (labels.length === 0) return false;
  if (labels.length > MAX_CONDITION_LABELS) {
    throw new Error("Too many condition labels.");
  }

  const sudo = context.sudo();
  const study = await sudo.query.Study.findOne({
    where: { id: studyId },
    query: "id components",
  });
  if (!study) {
    throw new Error("Study not found.");
  }

  const components =
    study.components && typeof study.components === "object"
      ? { ...study.components }
      : {};
  for (const label of labels) {
    const current = Number(components[label]);
    components[label] = Number.isFinite(current) ? current + 1 : 1;
  }

  await sudo.query.Study.updateOne({
    where: { id: studyId },
    data: { components },
    query: "id",
  });
  return true;
}

/**
 * Save a guest participant's studiesInfo. Guests have no session; the guest
 * publicId (kept in the participant's link) identifies them, as in startRun.
 */
export async function updateGuestStudiesInfo(
  root: any,
  { publicId, studiesInfo }: { publicId: string; studiesInfo: any },
  context: any
): Promise<any> {
  if (!publicId) {
    throw new Error("Guest not found.");
  }
  if (!studiesInfo || typeof studiesInfo !== "object") {
    throw new Error("Invalid study information.");
  }

  const sudo = context.sudo();
  const guest = await sudo.query.Guest.findOne({
    where: { publicId },
    query: "id",
  });
  if (!guest) {
    throw new Error("Guest not found.");
  }

  return sudo.query.Guest.updateOne({
    where: { id: guest.id },
    data: { studiesInfo },
    query: "id",
  });
}
