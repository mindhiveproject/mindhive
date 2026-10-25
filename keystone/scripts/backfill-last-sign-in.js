/**
 * One-off backfill: give every existing account a Profile.lastSignInAt.
 *
 * Sign-ins are recorded from now on (session strategy in auth.ts), but
 * accounts created before that have no history. Without a value they would
 * never reach the two-year de-identification rule, so each one gets its latest
 * known activity instead: the newest of its creation date and the dates of its
 * datasets, journals, posts, homework and logs. An account with no date at all
 * gets the time of this run, which starts its clock now.
 *
 * Run it once after `npm run migrate` (or after `keystone dev` has updated the
 * database), from the keystone directory:
 *
 *   node scripts/backfill-last-sign-in.js --dry-run
 *   NODE_ENV=production node scripts/backfill-last-sign-in.js
 *
 * The script is idempotent: an account that already has a lastSignInAt (a real
 * sign-in, or an earlier run) is left alone. The dry run prints how many
 * accounts are already past two years, i.e. how many the first
 * de-identification run would process. No names, emails or ids are printed.
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

const BATCH_SIZE = 200;
const TWO_YEARS_MS = 2 * 365.25 * 24 * 60 * 60 * 1000;

/** profileId -> newest date, folded in from one groupBy result. */
function foldLatest(latest, rows, key, fields) {
  for (const row of rows) {
    const id = row[key];
    if (!id) continue;
    for (const field of fields) {
      const value = row._max[field];
      if (value && (!latest.has(id) || value > latest.get(id))) {
        latest.set(id, value);
      }
    }
  }
}

async function main() {
  const prisma = new PrismaClient();
  const now = new Date();

  try {
    const profiles = await prisma.profile.findMany({
      where: { lastSignInAt: null },
      select: { id: true, dateCreated: true },
    });

    // One grouped query per source, not one per account.
    const latest = new Map();
    const sources = [
      ["dataset", "profileId", ["createdAt"]],
      ["journal", "creatorId", ["createdAt", "updatedAt"]],
      ["post", "authorId", ["createdAt", "updatedAt"]],
      ["homework", "authorId", ["createdAt", "updatedAt"]],
      ["log", "userId", ["createdAt"]],
    ];
    for (const [model, key, fields] of sources) {
      const rows = await prisma[model].groupBy({
        by: [key],
        where: { [key]: { not: null } },
        _max: Object.fromEntries(fields.map((field) => [field, true])),
      });
      foldLatest(latest, rows, key, fields);
    }

    let fromActivity = 0;
    let fromCreation = 0;
    let fromNow = 0;
    let pastTwoYears = 0;

    const updates = profiles.map((profile) => {
      let value = latest.get(profile.id) || null;
      if (profile.dateCreated && (!value || profile.dateCreated > value)) {
        value = profile.dateCreated;
      }
      if (latest.has(profile.id)) fromActivity++;
      else if (value) fromCreation++;
      else fromNow++;
      if (!value) value = now;
      if (now - value > TWO_YEARS_MS) pastTwoYears++;
      return { id: profile.id, value };
    });

    console.log(`Accounts without lastSignInAt: ${profiles.length}`);
    console.log(`  dated from their activity:       ${fromActivity}`);
    console.log(`  dated from their creation only:  ${fromCreation}`);
    console.log(`  no date found, set to this run:  ${fromNow}`);
    console.log(`  already past two years:          ${pastTwoYears}`);

    if (isDryRun) {
      console.log("Dry run: nothing was written.");
      return;
    }

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map(({ id, value }) =>
          prisma.profile.updateMany({
            // lastSignInAt: null keeps a sign-in that landed during the run
            where: { id, lastSignInAt: null },
            data: { lastSignInAt: value },
          })
        )
      );
    }
    console.log(`Backfilled ${updates.length} accounts.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
