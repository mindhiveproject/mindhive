/**
 * One-off migration: move the study versions out of the Study.versionHistory
 * JSON column into the StudyVersion list.
 *
 * Run it once after `npm run migrate` (or after `keystone dev` has updated the
 * database), from the keystone directory:
 *
 *   NODE_ENV=production node scripts/migrate-study-versions.js
 *   node scripts/migrate-study-versions.js --dry-run
 *
 * The script is idempotent: an entry that has already been migrated (a
 * StudyVersion with the same legacyId) is skipped, so it can be run again.
 *
 * The original versionHistory is left untouched, and the id of every migrated
 * entry is kept in StudyVersion.legacyId, so the versions of the datasets that
 * were collected before the migration keep resolving to a version name.
 */

const { PrismaClient } = require("@prisma/client");

const isDryRun = process.argv.includes("--dry-run");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.NODE_ENV === "development"
      ? "file:./keystone.db"
      : process.env.DATABASE_DEV || "";
}

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Set it to the database you want to migrate."
  );
  process.exit(1);
}

const toDate = (value) => {
  if (!value) return new Date();
  const date = new Date(typeof value === "number" ? value : String(value));
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

async function main() {
  const prisma = new PrismaClient();

  let studiesMigrated = 0;
  let versionsCreated = 0;
  let versionsSkipped = 0;
  let collectionVersionsRepointed = 0;

  try {
    const studies = await prisma.study.findMany({
      select: { id: true, title: true, versionHistory: true, currentVersion: true },
    });

    for (const study of studies) {
      let history = study.versionHistory;
      if (typeof history === "string") {
        try {
          history = JSON.parse(history);
        } catch (e) {
          console.warn(`Study ${study.id}: versionHistory is not valid JSON, skipped`);
          continue;
        }
      }
      if (!Array.isArray(history) || !history.length) continue;

      let createdForStudy = 0;

      for (const entry of history) {
        if (!entry?.id) continue;

        const existing = await prisma.studyVersion.findFirst({
          where: { legacyId: entry.id, studyId: study.id },
          select: { id: true },
        });
        if (existing) {
          versionsSkipped += 1;
          // the study version was migrated by an earlier run: make sure the
          // data collection version still points at the migrated row
          if (study.currentVersion === entry.id && !isDryRun) {
            await prisma.study.update({
              where: { id: study.id },
              data: { currentVersion: existing.id },
            });
            collectionVersionsRepointed += 1;
          }
          continue;
        }

        if (isDryRun) {
          versionsCreated += 1;
          createdForStudy += 1;
          continue;
        }

        const created = await prisma.studyVersion.create({
          data: {
            studyId: study.id,
            name: entry.name || "",
            description: entry.description || "",
            diagram: entry.diagram || "",
            legacyId: entry.id,
            createdAt: toDate(entry.createdAt),
          },
          select: { id: true },
        });
        versionsCreated += 1;
        createdForStudy += 1;

        // The data collection version is stamped on the collected datasets and
        // has to point at the migrated row. The datasets that were collected
        // before the migration keep the legacy id, which still resolves through
        // StudyVersion.legacyId.
        if (study.currentVersion === entry.id) {
          await prisma.study.update({
            where: { id: study.id },
            data: { currentVersion: created.id },
          });
          collectionVersionsRepointed += 1;
        }
      }

      if (createdForStudy) {
        studiesMigrated += 1;
        console.log(
          `Study ${study.id} (${study.title}): ${createdForStudy} version(s) migrated`
        );
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(
    [
      isDryRun ? "\nDry run, nothing was written." : "\nMigration finished.",
      `studies migrated: ${studiesMigrated}`,
      `versions created: ${versionsCreated}`,
      `versions already migrated: ${versionsSkipped}`,
      `data collection versions repointed: ${collectionVersionsRepointed}`,
    ].join("\n  ")
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
