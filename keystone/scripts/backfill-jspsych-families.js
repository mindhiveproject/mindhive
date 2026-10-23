/**
 * One-off backfill: put every existing JsPsychExperiment in its own family.
 *
 * Versions of one jsPsych experiment share a `family` key (C2 in the jsPsych
 * runtime plan). New rows get one when they are created; rows from before the
 * field existed have an empty family, and each becomes its own family, keyed
 * by its id.
 *
 * Run it once after `npm run migrate` (or after `keystone dev` has updated the
 * database), from the keystone directory:
 *
 *   node scripts/backfill-jspsych-families.js --dry-run
 *   NODE_ENV=production node scripts/backfill-jspsych-families.js
 *
 * The script is idempotent: a row that already has a family is left alone.
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
    "DATABASE_URL is not set. Set it to the database you want to backfill."
  );
  process.exit(1);
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.jsPsychExperiment.findMany({
      where: { family: "" },
      select: { id: true },
    });
    console.log(`${rows.length} jsPsych experiments have no family.`);
    if (isDryRun || rows.length === 0) return;
    await prisma.$transaction(
      rows.map(({ id }) =>
        prisma.jsPsychExperiment.update({
          where: { id },
          data: { family: id },
        })
      )
    );
    console.log(`Backfilled ${rows.length} jsPsych experiments.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
