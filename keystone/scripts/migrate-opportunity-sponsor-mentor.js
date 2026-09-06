/**
 * DEV-ONLY optional backfill: copy legacy Opportunity.mentor into sponsors/mentors.
 *
 * DO NOT RUN ON PRODUCTION. Production keeps the legacy mentor column and uses
 * resolution helpers (keystone/lib/opportunityStakeholders.ts) to read legacy
 * data without migration. Deploy production with additive schema sync only
 * (add sponsors/mentors join tables + Profile.opportunitiesSponsored; keep mentor).
 *
 * Use locally only if you want join-table rows populated for testing, after
 * Keystone has applied the new schema. If the legacy mentor column is still
 * present, rows are copied from it; otherwise opportunities with empty sponsors
 * are skipped.
 *
 * From the keystone directory:
 *
 *   node scripts/migrate-opportunity-sponsor-mentor.js --dry-run
 *   node scripts/migrate-opportunity-sponsor-mentor.js
 *
 * Idempotent: skips opportunities that already have at least one sponsor.
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

async function tableExists(prisma, tableName) {
  try {
    if (process.env.DATABASE_URL.startsWith("file:")) {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        tableName
      );
      return rows.length > 0;
    }
    const rows = await prisma.$queryRawUnsafe(
      `SELECT to_regclass(?) IS NOT NULL AS exists`,
      tableName
    );
    return Boolean(rows?.[0]?.exists);
  } catch {
    return false;
  }
}

async function columnExists(prisma, tableName, columnName) {
  try {
    if (process.env.DATABASE_URL.startsWith("file:")) {
      const rows = await prisma.$queryRawUnsafe(`PRAGMA table_info(${tableName})`);
      return rows.some((row) => row.name === columnName);
    }
    const rows = await prisma.$queryRawUnsafe(
      `
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2
        LIMIT 1
      `,
      tableName,
      columnName
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function main() {
  const prisma = new PrismaClient();
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const hasLegacyMentor = await columnExists(prisma, "Opportunity", "mentor");
    const hasSponsorsJoin = await tableExists(
      prisma,
      "_Opportunity_sponsors"
    );
    const hasMentorsJoin = await tableExists(prisma, "_Opportunity_mentors");

    if (!hasSponsorsJoin || !hasMentorsJoin) {
      console.error(
        "Join tables _Opportunity_sponsors / _Opportunity_mentors not found. Apply the new schema first."
      );
      process.exit(1);
    }

    const opportunities = await prisma.opportunity.findMany({
      select: {
        id: true,
        sponsorIsMentor: true,
        ...(hasLegacyMentor ? { mentor: true } : {}),
      },
    });

    for (const opp of opportunities) {
      const existingSponsors = await prisma.$queryRawUnsafe(
        `SELECT "A" FROM "_Opportunity_sponsors" WHERE "B" = ?`,
        opp.id
      );
      if (existingSponsors.length > 0) {
        skipped += 1;
        continue;
      }

      const legacyMentorId = hasLegacyMentor ? opp.mentor : null;
      if (!legacyMentorId) {
        console.warn(`Opportunity ${opp.id}: no legacy mentor — skipped`);
        skipped += 1;
        continue;
      }

      const addToMentors = opp.sponsorIsMentor !== false;

      if (isDryRun) {
        console.log(
          `[dry-run] ${opp.id}: sponsor=${legacyMentorId} mentor=${addToMentors ? legacyMentorId : "none"}`
        );
        migrated += 1;
        continue;
      }

      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "_Opportunity_sponsors" ("A", "B") VALUES (?, ?)`,
          legacyMentorId,
          opp.id
        );
        if (addToMentors) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "_Opportunity_mentors" ("A", "B") VALUES (?, ?)`,
            legacyMentorId,
            opp.id
          );
        }
        migrated += 1;
      } catch (e) {
        errors += 1;
        console.error(`Failed to migrate opportunity ${opp.id}:`, e);
      }
    }

    console.log(
      `Done. migrated=${migrated} skipped=${skipped} errors=${errors}${isDryRun ? " (dry-run)" : ""}`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
