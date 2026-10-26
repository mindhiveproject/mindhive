/**
 * One-off backfill: mark existing classes that run in NYC public schools as
 * Class.dataOwner = NYC_DOE, so their data is covered by the DOE agreement's
 * de-identification and deletion rules (lib/doe/findDoeData.ts).
 *
 * A class is marked when its creator or anyone on its teaching team signs in
 * with a DOE staff address (@schools.nyc.gov), or any of its students with a
 * DOE student address (@nycstudents.net). Classes that match neither are left
 * for an admin to review: run with --list to print them, then mark the DOE
 * ones in the Admin UI (Class -> Data owner, and School for the DBN).
 *
 * Run it once after `npm run migrate`, from the keystone directory:
 *
 *   node scripts/backfill-doe-classes.js --dry-run [--list]
 *   node scripts/backfill-doe-classes.js
 *
 * The script is idempotent and only ever marks: a class that already has a
 * data owner is left alone, and nothing is unmarked. Run it once, before
 * admins start reviewing: an admin's "not DOE" is stored as no data owner, the
 * same as "never set", so a later run would mark such a class again. Counts print no names,
 * emails or ids; --list prints class id, code, creation date and title only.
 */

const { PrismaClient } = require("@prisma/client");

const isDryRun = process.argv.includes("--dry-run");
const isList = process.argv.includes("--list");

// Keep in step with keystone/lib/doe/doe.ts.
const DOE_DATA_OWNER = "NYC_DOE";
const DOE_STAFF_DOMAIN = "@schools.nyc.gov";
const DOE_STUDENT_DOMAIN = "@nycstudents.net";

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

const isStaff = (email) =>
  typeof email === "string" && email.toLowerCase().endsWith(DOE_STAFF_DOMAIN);

async function main() {
  const prisma = new PrismaClient();

  try {
    const classes = await prisma.class.findMany({
      where: { dataOwner: null },
      select: {
        id: true,
        code: true,
        title: true,
        createdAt: true,
        creator: { select: { email: true } },
        teachingTeam: { select: { email: true } },
        // only whether one DOE student exists, not the roster
        students: {
          where: { email: { endsWith: DOE_STUDENT_DOMAIN } },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const byStaff = [];
    const byStudents = [];
    const unmatched = [];
    for (const klass of classes) {
      if (
        isStaff(klass.creator?.email) ||
        klass.teachingTeam.some((member) => isStaff(member.email))
      ) {
        byStaff.push(klass);
      } else if (klass.students.length > 0) {
        byStudents.push(klass);
      } else {
        unmatched.push(klass);
      }
    }
    const toMark = [...byStaff, ...byStudents];

    console.log(`Classes without a data owner: ${classes.length}`);
    console.log(`  DOE staff creator or teaching team: ${byStaff.length}`);
    console.log(`  DOE student accounts only:         ${byStudents.length}`);
    console.log(`  no DOE address, left for review:    ${unmatched.length}`);

    if (isList && unmatched.length) {
      console.log("\nLeft for review (id, code, created, title):");
      for (const klass of unmatched) {
        const created = klass.createdAt
          ? klass.createdAt.toISOString().slice(0, 10)
          : "";
        console.log(`  ${klass.id}\t${klass.code || ""}\t${created}\t${klass.title}`);
      }
    }

    if (isDryRun) {
      console.log("\nDry run: nothing was written.");
      return;
    }

    const { count } = await prisma.class.updateMany({
      // dataOwner: null keeps a mark set by hand during the run
      where: { id: { in: toMark.map((klass) => klass.id) }, dataOwner: null },
      data: { dataOwner: DOE_DATA_OWNER },
    });
    console.log(`\nMarked ${count} classes as NYC DOE.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
