// The participant rows behind a study dataset (dataOrigin STUDY or TEMPLATE),
// served through the dataset rather than through the study's results. Whoever
// may read the dataset (lib/datasourceAccess.js) gets its rows: the study's
// researchers, but also a class the teacher shared it with, or everyone when
// an admin made it public. Those viewers cannot read the study's results
// directly, so the rows are read as sudo here and cut down to what the Data
// Journal table needs: included runs only, public participant ids, no
// internal profile ids or participant info.

const STUDY_ORIGINS = ["STUDY", "TEMPLATE"];

/** A participant's id as the table shows it, never the internal profile id. */
function publicParticipant(person) {
  if (!person) return null;
  return {
    publicId: person.publicId || null,
    publicReadableId: person.publicReadableId || null,
  };
}

/** One SummaryResult reduced to the fields the journal table reads. */
function shapeSummaryRow(row) {
  const user = row?.user
    ? {
        ...publicParticipant(row.user),
        studentIn: (row.user.studentIn || [])
          .map((c) => (c?.code ? { code: c.code } : null))
          .filter(Boolean),
      }
    : null;
  return {
    metadataId: row?.metadataId || null,
    testVersion: row?.testVersion || null,
    type: row?.type || null,
    user,
    guest: publicParticipant(row?.guest),
    task: { title: row?.task?.title || "" },
    data: row?.data ?? {},
  };
}

/** One StudyDataSourceRecord reduced to its join key and aggregates. */
function shapeDataSourceRecord(record) {
  return {
    profile: record?.profile?.publicId
      ? { publicId: record.profile.publicId }
      : null,
    guest: record?.guest?.publicId ? { publicId: record.guest.publicId } : null,
    steps: record?.steps ?? [],
  };
}

/**
 * Class codes of each participant, looked up once for all of them. Asking for
 * `user { studentIn { code } }` on every SummaryResult would run one class
 * query per row (Keystone does not batch to-many relations), thousands for a
 * large study.
 * @returns {Promise<Map<string, Array<{ code: string }>>>}
 */
async function classCodesByProfile(context, profileIds) {
  const byProfile = new Map();
  const ids = [...new Set(profileIds.filter(Boolean))];
  if (!ids.length) return byProfile;
  const profiles = await context.prisma.profile.findMany({
    where: { id: { in: ids } },
    select: { id: true, studentIn: { select: { code: true } } },
  });
  for (const profile of profiles) {
    byProfile.set(profile.id, profile.studentIn || []);
  }
  return byProfile;
}

/**
 * The rows of a study dataset, or null when the caller cannot read the
 * dataset or it does not read a study.
 *   { flow, includedCount, summaryResults, dataSourceRecords }
 */
async function loadDatasourceStudyRows(context, datasourceId) {
  if (!context?.session?.itemId || !datasourceId) return null;

  // Read as the caller: the dataset read rule decides.
  const datasource = await context.query.Datasource.findOne({
    where: { id: String(datasourceId) },
    query: "id dataOrigin study { id }",
  });
  const studyId = datasource?.study?.id;
  if (!studyId || !STUDY_ORIGINS.includes(datasource.dataOrigin)) return null;

  const sudo = context.sudo();
  const study = await sudo.query.Study.findOne({
    where: { id: studyId },
    query: `
      id
      flow
      datasets(where: { isIncluded: { equals: true } }) { token }
      dataSourceRecords {
        profile { publicId }
        guest { publicId }
        steps
      }
    `,
  });
  if (!study) return null;

  const tokens = (study.datasets || []).map((d) => d?.token).filter(Boolean);
  const summaryResults = tokens.length
    ? await sudo.query.SummaryResult.findMany({
        where: {
          study: { id: { equals: studyId } },
          metadataId: { in: tokens },
        },
        query: `
          metadataId
          testVersion
          type
          data
          user { id publicId publicReadableId }
          guest { publicId publicReadableId }
          task { title }
        `,
      })
    : [];

  const classCodes = await classCodesByProfile(
    context,
    summaryResults.map((row) => row?.user?.id)
  );
  const withClasses = summaryResults.map((row) =>
    row?.user
      ? {
          ...row,
          user: { ...row.user, studentIn: classCodes.get(row.user.id) || [] },
        }
      : row
  );

  return {
    flow: study.flow ?? null,
    includedCount: tokens.length,
    summaryResults: withClasses.map(shapeSummaryRow),
    dataSourceRecords: (study.dataSourceRecords || []).map(
      shapeDataSourceRecord
    ),
  };
}

module.exports = {
  loadDatasourceStudyRows,
  shapeSummaryRow,
  shapeDataSourceRecord,
};
