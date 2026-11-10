/**
 * Read-only audit of main projects (ProposalBoard.isMain) and class links.
 *
 * The one-main-per-class rule is enforced on writes from now on
 * (lib/mainProject.js); this lists what older data already breaks it, so it
 * can be cleaned up by hand or with a follow-up script. Nothing is changed.
 *
 * It reports:
 *   1. students with more than one main project in a class
 *      (class staff on a board are not counted as its students);
 *   2. main projects that are not linked to a class;
 *   3. boards whose class does not use the class board they were made from
 *      (they were moved between classes).
 *
 * Run from the keystone directory:
 *
 *   node scripts/audit-main-projects.js            # counts only
 *   node scripts/audit-main-projects.js --details  # also board and class ids
 *
 * No names or emails are printed; --details prints ids only.
 */

const { PrismaClient } = require("@prisma/client");

const showDetails = process.argv.includes("--details");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.NODE_ENV === "development"
      ? "file:./keystone.db"
      : process.env.DATABASE_DEV || "";
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Set it to the database to audit.");
  process.exit(1);
}

const prisma = new PrismaClient();

const ids = (items) => (items || []).map((item) => item.id);

async function main() {
  const classes = await prisma.class.findMany({
    select: {
      id: true,
      creatorId: true,
      teachingTeam: { select: { id: true } },
      mentors: { select: { id: true } },
    },
  });
  const staffByClass = new Map(
    classes.map((klass) => [
      klass.id,
      new Set(
        [klass.creatorId, ...ids(klass.teachingTeam), ...ids(klass.mentors)].filter(
          Boolean
        )
      ),
    ])
  );

  // 1. Students with more than one main project in a class.
  const mains = await prisma.proposalBoard.findMany({
    where: { isMain: true, isHidden: false, usedInClassId: { not: null } },
    select: {
      id: true,
      usedInClassId: true,
      authorId: true,
      collaborators: { select: { id: true } },
    },
  });
  const mainsByStudentAndClass = new Map();
  for (const board of mains) {
    const staff = staffByClass.get(board.usedInClassId) || new Set();
    const students = new Set(
      [board.authorId, ...ids(board.collaborators)].filter(
        (id) => id && !staff.has(id)
      )
    );
    for (const studentId of students) {
      const key = `${board.usedInClassId}:${studentId}`;
      if (!mainsByStudentAndClass.has(key)) mainsByStudentAndClass.set(key, []);
      mainsByStudentAndClass.get(key).push(board.id);
    }
  }
  const doubles = [...mainsByStudentAndClass.entries()].filter(
    ([, boardIds]) => boardIds.length > 1
  );
  console.log(`Main projects in a class: ${mains.length}`);
  console.log(
    `1. Students with more than one main project in a class: ${doubles.length}`
  );
  if (showDetails) {
    for (const [key, boardIds] of doubles) {
      const [classId, studentId] = key.split(":");
      console.log(`   class ${classId} student ${studentId}: boards ${boardIds.join(", ")}`);
    }
  }

  // 2. Main projects without a class.
  const unlinked = await prisma.proposalBoard.findMany({
    where: { isMain: true, isHidden: false, usedInClassId: null },
    select: { id: true },
  });
  console.log(`2. Main projects not linked to a class: ${unlinked.length}`);
  if (showDetails) {
    for (const board of unlinked) console.log(`   board ${board.id}`);
  }

  // 3. Boards whose class does not use the class board they were made from.
  const cloned = await prisma.proposalBoard.findMany({
    where: {
      isHidden: false,
      usedInClassId: { not: null },
      clonedFromId: { not: null },
    },
    select: {
      id: true,
      usedInClassId: true,
      clonedFrom: {
        select: {
          id: true,
          templatesForClass: { select: { id: true } },
          templateForClasses: { select: { id: true } },
        },
      },
    },
  });
  const moved = cloned.filter((board) => {
    const templateClassIds = [
      ...ids(board.clonedFrom?.templatesForClass),
      ...ids(board.clonedFrom?.templateForClasses),
    ];
    return (
      templateClassIds.length > 0 &&
      !templateClassIds.includes(board.usedInClassId)
    );
  });
  console.log(
    `3. Boards in a class that does not use their class board: ${moved.length}`
  );
  if (showDetails) {
    for (const board of moved) {
      console.log(
        `   board ${board.id} in class ${board.usedInClassId}, made from ${board.clonedFrom.id}`
      );
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
