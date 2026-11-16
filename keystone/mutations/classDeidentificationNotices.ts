import { isAdmin } from "../access";
import { identityRemovalDate } from "../lib/doe/doe";

// The students of one class who were warned that their identity will be
// removed (runDeidentification) and have not signed in since, for the class's
// Students page: the teachers' email links there instead of naming anyone.
// The class's teacher and co-teachers, and admins, only. Ids and dates only;
// the page already shows the roster.
//
// One query: the class by its primary key, the caller's row in the teaching
// team, and its students filtered on the two retention fields through the
// indexed _Class_students join table. No scan of Profile.
async function classDeidentificationNotices(
  root: any,
  { classId }: { classId: string },
  context: any
): Promise<{ id: string; date: string }[]> {
  const me = context.session?.itemId ? String(context.session.itemId) : null;
  if (!me) throw new Error("You must be signed in.");
  const klass = await context.prisma.class.findUnique({
    where: { id: String(classId) },
    select: {
      creatorId: true,
      teachingTeam: { where: { id: me }, select: { id: true } },
      students: {
        where: { deidentifiedAt: null, deidentificationWarnedAt: { not: null } },
        select: { id: true, lastSignInAt: true, deidentificationWarnedAt: true },
      },
    },
  });
  if (!klass) return [];
  const allowed =
    klass.creatorId === me ||
    klass.teachingTeam.length > 0 ||
    isAdmin({ session: context.session } as any);
  if (!allowed) throw new Error("Forbidden: class teachers only.");
  return klass.students
    .filter((s: any) => s.lastSignInAt)
    .map((s: any) => ({
      id: s.id,
      date: identityRemovalDate(s.lastSignInAt, s.deidentificationWarnedAt),
    }));
}

export default classDeidentificationNotices;
