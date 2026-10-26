/**
 * One-off backfill: give every existing account a Profile.lastSignInAt.
 *
 * Sign-ins are recorded from now on (session strategy in auth.ts), but
 * accounts created before that have no history. Without a value they would
 * never reach the two-year de-identification rule, so each one gets its latest
 * known activity instead: the newest of its creation date and the dates of
 * everything it authored, created, submitted or edited (participation data,
 * journals, boards, studies, classes, lessons, Connect answers and more; see
 * `sources` below). An account with no date at all
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

    // Every record that carries a person's own action (author, creator,
    // submitter, editor) and a date: [model, profile keys, date fields].
    // Passive links are left out on purpose: notifications received, invites
    // received, datasets other people collected on someone's task. updatedAt
    // can also move when others edit a record (a class a student joins, a
    // shared board), which only makes an account look more recent, never less.
    // One grouped query per source and key, not one per account.
    const BOTH = ["createdAt", "updatedAt"];
    const CREATED = ["createdAt"];
    const sources = [
      // participation and personal work
      ["dataset", ["profileId"], ["createdAt", "completedAt"]],
      ["summaryResult", ["userId"], BOTH],
      ["studyDataSourceRecord", ["profileId"], BOTH],
      ["journal", ["creatorId"], BOTH],
      ["post", ["authorId"], BOTH],
      ["homework", ["authorId"], BOTH],
      ["review", ["authorId"], BOTH],
      ["talk", ["authorId"], BOTH],
      ["word", ["authorId"], BOTH],
      ["log", ["userId"], BOTH],
      // projects, studies and tasks
      ["proposalBoard", ["creatorId", "authorId"], BOTH],
      ["proposalCard", ["isEditedById"], ["updatedAt"]],
      ["study", ["authorId"], BOTH],
      ["studyVersion", ["createdById"], CREATED],
      ["template", ["authorId"], BOTH],
      ["task", ["authorId"], BOTH],
      ["consent", ["authorId"], BOTH],
      ["spec", ["authorId"], BOTH],
      ["jsPsychExperiment", ["authorId"], BOTH],
      ["datasource", ["authorId"], BOTH],
      ["dataSourceBlock", ["authorId"], BOTH],
      ["visual", ["authorId", "isEditedById"], CREATED],
      ["mediaAsset", ["authorId"], CREATED],
      // teaching
      ["class", ["creatorId"], BOTH],
      ["classNetwork", ["creatorId"], BOTH],
      ["networkInvite", ["requestedById", "reviewedById"], CREATED],
      ["curriculum", ["authorId"], BOTH],
      ["lesson", ["authorId"], BOTH],
      ["assignment", ["authorId"], BOTH],
      ["resource", ["authorId"], BOTH],
      ["formDefinition", ["createdById", "publishedById"], BOTH],
      // Connect, organizations, support
      ["connectRound", ["createdById"], BOTH],
      ["connectQuestion", ["proposedById", "approvedById"], BOTH],
      ["connectPreference", ["submitterId"], ["submittedAt", ...BOTH]],
      ["connectTeamPreference", ["submitterId"], CREATED],
      ["connectMatch", ["createdById"], BOTH],
      ["connectRating", ["raterId"], CREATED],
      ["opportunity", ["reviewedById"], BOTH],
      ["opportunityReviewNote", ["authorId"], BOTH],
      ["organization", ["createdById"], BOTH],
      ["organizationInvite", ["invitedById"], CREATED],
      ["friendship", ["requesterId"], CREATED],
      ["ticket", ["reporterId"], BOTH],
      ["ticketAnnotation", ["authorId"], CREATED],
    ];
    const latest = new Map();
    for (const [model, keys, fields] of sources) {
      for (const key of keys) {
        const rows = await prisma[model].groupBy({
          by: [key],
          where: { [key]: { not: null } },
          _max: Object.fromEntries(fields.map((field) => [field, true])),
        });
        foldLatest(latest, rows, key, fields);
      }
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
