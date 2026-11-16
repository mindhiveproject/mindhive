// A study's results for its Collect page and downloads (study runs, summary
// results, data source records), checked once per request at the study level.
//
// Through the regular API (GET_STUDY_RESULTS → study { summaryResults { user
// guest task study } ... }) Keystone resolved every nested relationship one
// row at a time and ran the Profile, Guest and result read filters for each:
// a study with a few thousand results took minutes and held database
// connections the whole time, slowing every other request. Here the viewer
// passes one check — they may edit the study, the same people the result read
// filters let see a study's results (see lib/runtime/resultAccess.js) — and
// the data is then read in a handful of flat queries.
//
// The result keeps the shape GET_STUDY_RESULTS used to return under `study`.

const { studyGateWhere } = require("./studyCollect");

// JSON fields come back parsed from Postgres and as text from SQLite.
function parseJson(value) {
  if (typeof value !== "string") return value ?? null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value ?? null;
}

const publicIdOf = (item) => (item ? { publicId: item.publicId } : null);

async function loadStudyResults(context, studyId, accessFilter) {
  const where = studyGateWhere(studyId, accessFilter);
  const allowed =
    !!where && (await context.sudo().db.Study.count({ where })) > 0;
  if (!allowed) {
    throw new Error("You do not have access to this study's data.");
  }

  const id = String(studyId);
  const { prisma } = context;
  const [study, datasets, summaryResults, dataSourceRecords] =
    await Promise.all([
      prisma.study.findUnique({
        where: { id },
        select: {
          id: true,
          slug: true,
          title: true,
          flow: true,
          versionHistory: true,
          consent: { select: { id: true, title: true } },
          versions: { select: { id: true, name: true, legacyId: true } },
        },
      }),
      prisma.dataset.findMany({
        where: { studyId: id },
        select: {
          date: true,
          token: true,
          isCompleted: true,
          isIncluded: true,
          testVersion: true,
          dataPolicy: true,
          task: { select: { id: true, slug: true } },
        },
      }),
      prisma.summaryResult.findMany({
        where: { studyId: id },
        select: {
          data: true,
          testVersion: true,
          metadataId: true,
          createdAt: true,
          user: { select: { publicId: true } },
          guest: { select: { publicId: true } },
          task: { select: { id: true, slug: true, title: true } },
        },
      }),
      prisma.studyDataSourceRecord.findMany({
        where: { studyId: id },
        select: {
          steps: true,
          profile: { select: { publicId: true } },
          guest: { select: { publicId: true } },
        },
      }),
    ]);
  if (!study) {
    throw new Error("You do not have access to this study's data.");
  }

  return {
    id: study.id,
    slug: study.slug,
    flow: parseJson(study.flow),
    datasets: datasets.map((dataset) => ({
      date: dataset.date,
      token: dataset.token,
      task: dataset.task ?? null,
      isCompleted: !!dataset.isCompleted,
      isIncluded: !!dataset.isIncluded,
      testVersion: dataset.testVersion,
      dataPolicy: dataset.dataPolicy,
    })),
    summaryResults: summaryResults.map((result) => ({
      data: parseJson(result.data),
      user: publicIdOf(result.user),
      guest: publicIdOf(result.guest),
      study: { title: study.title },
      task: result.task ?? null,
      testVersion: result.testVersion,
      metadataId: result.metadataId,
      createdAt: toIso(result.createdAt),
    })),
    dataSourceRecords: dataSourceRecords.map((record) => ({
      profile: publicIdOf(record.profile),
      guest: publicIdOf(record.guest),
      steps: parseJson(record.steps),
    })),
    consent: study.consent,
    versions: study.versions,
    versionHistory: parseJson(study.versionHistory),
  };
}

module.exports = {
  loadStudyResults,
};
