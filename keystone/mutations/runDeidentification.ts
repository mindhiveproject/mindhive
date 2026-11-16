import { createHash, timingSafeEqual } from "crypto";

import {
  TWO_YEARS_MS,
  WARNING_MS,
  identityRemovalDate,
} from "../lib/doe/doe";
import { findDoeData, inChunks } from "../lib/doe/findDoeData";
import { deidentifyProfile } from "../lib/purge/deidentify";
import { changeStoredJson, stripPersonalKeys } from "../lib/purge/personal";
import { sendNotificationEmail } from "../lib/mail";
import { getRetentionSettings } from "./retentionSettings";

// The DOE de-identification job (de-identification policy: "When data is
// de-identified or deleted"). Reviews happen twice a year, between semesters,
// each as two runs at least 30 days apart: the first warns, the second
// de-identifies the accounts warned. Every run does both steps, for whoever is
// due. For DOE accounts only:
//   1. no sign-in for 23 months and no warning yet -> warning email, and
//      deidentificationWarnedAt is set (a sign-in clears it, auth.ts);
//   2. the teacher and co-teachers of every class a warned student is in
//      get one email each, with how many of their students are due per class
//      and a link to the class's Students page, never names: the email
//      service keeps sent emails, and erasing a person's emails there finds
//      them by recipient. Once per warning: deidentificationTeachersNotifiedAt
//      (also cleared by a sign-in). Students due for step 3 are left out,
//      since the email asks them to sign in before the date;
//   3. no sign-in for two years and warned at least 30 days ago ->
//      lib/purge/deidentify. Accounts past two years on the first run (the
//      backfill dated many) are warned first and de-identified at a later run.
//   4. guests in DOE studies whose participation is over two years old ->
//      the personal details on the guest record are stripped.
// It never deletes accounts or study data; full deletion is the admin tool.
// Staff accounts (admins, Admin UI users, retention operators) are skipped.
//
// Two ways in, as pruneTicketScreenshots: an admin with canRunRetention, or
// the scheduled workflow (.github/workflows/deidentify.yml) with the shared
// RETENTION_SECRET, since cron has no session. Every run, dry or not, is
// logged in RetentionRun with counts only.
//
// Nothing happens without an admin's say, unless they switch it on:
//   - the scheduled run acts only when RetentionSetting.autoDeidentify is on;
//     otherwise it is forced to a dry run and only logs what it would do;
//   - an admin's dry run returns the accounts it would warn, tell teachers
//     about, or de-identify, and an admin's real run must name the accounts
//     it approves (profileIds): only those that are still due are acted on.
//     Approving a warning approves the teachers' email about it.

const DEFAULT_LIMIT = 100;
const CHUNK = 5000;

function secretMatches(provided: string): boolean {
  const expected = process.env.RETENTION_SECRET;
  if (!expected) return false; // fail closed
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

async function assertAllowed(context: any, secret?: string | null) {
  if (secret) {
    if (!secretMatches(secret)) throw new Error("Forbidden.");
    return;
  }
  const me = context.session?.itemId;
  if (!me) throw new Error("You must be signed in to run this mutation.");
  const profile = await context.query.Profile.findOne({
    where: { id: me },
    query: "permissions { canRunRetention }",
  });
  if (!(profile?.permissions || []).some((p: any) => p.canRunRetention)) {
    throw new Error("Forbidden: canRunRetention required.");
  }
}

function canEmail(email: unknown): email is string {
  return (
    typeof email === "string" &&
    email.includes("@") &&
    !email.toLowerCase().endsWith(".invalid")
  );
}

const frontendUrl = () => process.env.FRONTEND_URL || "https://mindhive.science";

type TeacherNotice = {
  email: string;
  classes: Map<string, { title: string; code: string; students: Set<string> }>;
};

function teacherNoticeText(notice: TeacherNotice, dateOf: Map<string, string>) {
  const classes = [...notice.classes.values()].map((c) => {
    const n = c.students.size;
    const date = [...c.students].map((id) => dateOf.get(id)!).sort()[0];
    return `${c.title || "Untitled class"}: ${n} ${n === 1 ? "student" : "students"}, on or after ${date}`;
  });
  return (
    "Some students in your MindHive classes have not signed in for two years or " +
    "close to it. Unless they sign in before the date shown, their identity will " +
    "be removed from their accounts: their names, email addresses and other " +
    "personal details will be deleted, the accounts will no longer be linked to " +
    "them, and they will leave your classes. " +
    `${classes.join("; ")}. ` +
    "The Students page of each class shows which students. To keep their " +
    "accounts, they only need to sign in."
  );
}

function sum(into: Record<string, any>, from: Record<string, any>) {
  for (const [key, value] of Object.entries(from)) {
    if (typeof value === "number") into[key] = (into[key] || 0) + value;
    else if (value && typeof value === "object") sum((into[key] ||= {}), value);
  }
}

async function runDeidentification(
  root: any,
  {
    dryRun = true,
    secret,
    limit,
    profileIds,
  }: {
    dryRun?: boolean | null;
    secret?: string | null;
    limit?: number | null;
    profileIds?: string[] | null;
  },
  context: any
) {
  await assertAllowed(context, secret);
  const scheduled = !!secret;
  const { autoDeidentify } = await getRetentionSettings(context.prisma);
  // the schedule acts only when admins have switched it on
  const isDry = dryRun !== false || (scheduled && !autoDeidentify);
  // an admin's real run acts only on the accounts they approved
  const approved = scheduled ? null : new Set(profileIds || []);
  if (!isDry && approved && !approved.size) {
    throw new Error(
      "Approve accounts first: run a dry run, then pass the profileIds to act on."
    );
  }
  const batch = Math.max(1, Math.min(limit || DEFAULT_LIMIT, 1000));
  const prisma = context.prisma;
  const now = Date.now();
  const startedAt = new Date(now);
  const deidCutoff = new Date(now - TWO_YEARS_MS);
  const warnCutoff = new Date(now - TWO_YEARS_MS + WARNING_MS);
  const warnedLongEnough = new Date(now - WARNING_MS);

  // DOE accounts not yet de-identified and silent for 23 months or more.
  const doe = await findDoeData(prisma, { all: true });
  const accounts: any[] = [];
  for (let i = 0; i < doe.profileIds.length; i += CHUNK) {
    accounts.push(
      ...(await prisma.profile.findMany({
        where: {
          id: { in: doe.profileIds.slice(i, i + CHUNK) },
          deidentifiedAt: null,
          lastSignInAt: { lt: warnCutoff },
        },
        select: {
          id: true,
          username: true,
          email: true,
          lastSignInAt: true,
          deidentificationWarnedAt: true,
          deidentificationTeachersNotifiedAt: true,
          permissions: {
            select: { canManageUsers: true, canAccessAdminUI: true, canRunRetention: true },
          },
        },
      }))
    );
  }
  const isStaff = (a: any) =>
    a.permissions.some((p: any) => p.canManageUsers || p.canAccessAdminUI || p.canRunRetention);
  const eligible = accounts.filter(
    (a) => !isStaff(a) && (isDry || !approved || approved.has(a.id))
  );
  const toWarn = eligible.filter((a) => !a.deidentificationWarnedAt);
  const due = eligible.filter(
    (a) =>
      a.deidentificationWarnedAt &&
      a.deidentificationWarnedAt <= warnedLongEnough &&
      a.lastSignInAt < deidCutoff
  );

  const counts: Record<string, any> = {
    autoDeidentify,
    doeAccounts: doe.profileIds.length,
    staffSkipped: accounts.filter(isStaff).length,
    warned: 0,
    warnedWithoutEmail: 0,
    warningFailed: 0,
    teacherNoticeStudents: 0,
    teachersNotified: 0,
    teacherNoticeFailed: 0,
    studentsWithoutTeacher: 0,
    deidentified: 0,
    dueLeftForNextRun: Math.max(0, due.length - batch),
    deidentification: {},
    guestsStripped: 0,
  };

  // 1. Warnings. Accounts warned now or before, for the teachers' step.
  const warned = new Set<string>(
    eligible.filter((a) => a.deidentificationWarnedAt).map((a) => a.id)
  );
  const loginUrl = `${frontendUrl()}/login`;
  for (const account of toWarn) {
    const date = identityRemovalDate(account.lastSignInAt, startedAt);
    if (!canEmail(account.email)) {
      counts.warnedWithoutEmail++;
    } else if (!isDry) {
      try {
        await sendNotificationEmail(
          account.email,
          "Sign in to keep your MindHive account",
          `You have not signed in to MindHive for two years or close to it. On or after ${date}, ` +
            "your identity will be removed from your account: your name, email " +
            "address and other personal details will be deleted, and the account " +
            "will no longer be linked to you. To keep your account, sign in before then.",
          loginUrl
        );
        counts.warned++;
      } catch (error: any) {
        counts.warningFailed++;
        console.error(`[runDeidentification] warning email failed: ${error?.message}`);
        continue; // not marked: the next run tries again
      }
    } else {
      counts.warned++;
    }
    if (!isDry) {
      await prisma.profile.update({
        where: { id: account.id },
        data: { deidentificationWarnedAt: new Date(now) },
      });
    }
    warned.add(account.id);
  }

  // 2. Teachers of the warned students, one email per teacher.
  const dueIds = new Set(due.map((a) => a.id));
  const notifyAbout = eligible.filter(
    (a) => warned.has(a.id) && !dueIds.has(a.id) && !a.deidentificationTeachersNotifiedAt
  );
  const dateOf = new Map<string, string>(
    notifyAbout.map((a) => [
      a.id,
      identityRemovalDate(a.lastSignInAt, a.deidentificationWarnedAt || startedAt),
    ])
  );
  // One flat query per chunk: classes through the indexed _Class_students
  // join table, with only the chunk's students and the teachers' email.
  const teacherSelect = { select: { id: true, email: true, deidentifiedAt: true } };
  const classRows = await inChunks(
    notifyAbout.map((a) => a.id),
    (part) =>
      prisma.class.findMany({
        where: { students: { some: { id: { in: part } } } },
        select: {
          id: true,
          title: true,
          code: true,
          creator: teacherSelect,
          teachingTeam: teacherSelect,
          students: { where: { id: { in: part } }, select: { id: true } },
        },
      })
  );
  const notices = new Map<string, TeacherNotice>();
  const teachersOf = new Map<string, Set<string>>();
  for (const klass of classRows as any[]) {
    const teachers = [klass.creator, ...klass.teachingTeam].filter(
      (t: any) => t && !t.deidentifiedAt && !dueIds.has(t.id) && canEmail(t.email)
    );
    for (const { id: studentId } of klass.students) {
      for (const teacher of teachers) {
        if (teacher.id === studentId) continue;
        let notice = notices.get(teacher.id);
        if (!notice) notices.set(teacher.id, (notice = { email: teacher.email, classes: new Map() }));
        let entry = notice.classes.get(klass.id);
        if (!entry) {
          notice.classes.set(
            klass.id,
            (entry = { title: klass.title, code: klass.code, students: new Set() })
          );
        }
        entry.students.add(studentId);
        if (!teachersOf.has(studentId)) teachersOf.set(studentId, new Set());
        teachersOf.get(studentId)!.add(teacher.id);
      }
    }
  }
  const failedTeachers = new Set<string>();
  for (const [teacherId, notice] of notices) {
    if (isDry) {
      counts.teachersNotified++;
      continue;
    }
    const only = notice.classes.size === 1 ? [...notice.classes.values()][0] : null;
    const link = only
      ? `${frontendUrl()}/dashboard/myclasses/${encodeURIComponent(only.code)}?page=students`
      : `${frontendUrl()}/dashboard/myclasses`;
    try {
      await sendNotificationEmail(
        notice.email,
        "Some of your MindHive students need to sign in",
        teacherNoticeText(notice, dateOf),
        link
      );
      counts.teachersNotified++;
    } catch (error: any) {
      failedTeachers.add(teacherId);
      counts.teacherNoticeFailed++;
      console.error(`[runDeidentification] teacher email failed: ${error?.message}`);
    }
  }
  // A student is done once every one of their teachers got the email; a
  // student with no teacher to email is done too. A failure leaves the
  // student for the next run, which may email their other teachers again.
  const notified: string[] = [];
  for (const account of notifyAbout) {
    const teachers = teachersOf.get(account.id);
    if (!teachers) counts.studentsWithoutTeacher++;
    else counts.teacherNoticeStudents++;
    if (![...(teachers || [])].some((id) => failedTeachers.has(id))) notified.push(account.id);
  }
  if (!isDry) {
    await inChunks(notified, async (part) => {
      await prisma.profile.updateMany({
        where: { id: { in: part } },
        data: { deidentificationTeachersNotifiedAt: startedAt },
      });
      return [];
    });
  }

  // 3. De-identification, one account at a time.
  for (const account of due.slice(0, batch)) {
    const result = await deidentifyProfile(context, account.id, { dryRun: isDry });
    if (result.skipped) continue;
    counts.deidentified++;
    const { skipped, ...numbers } = result;
    sum(counts.deidentification, numbers);
  }

  // 4. Guests in DOE studies, after two years.
  const guests: any[] = [];
  for (let i = 0; i < doe.guestIds.length; i += CHUNK) {
    guests.push(
      ...(await prisma.guest.findMany({
        where: { id: { in: doe.guestIds.slice(i, i + CHUNK) }, createdAt: { lt: deidCutoff } },
        select: { id: true, info: true, generalInfo: true, studiesInfo: true, consentsInfo: true, tasksInfo: true },
      }))
    );
  }
  for (const guest of guests) {
    const data: Record<string, unknown> = {};
    for (const field of ["info", "generalInfo", "studiesInfo", "consentsInfo", "tasksInfo"]) {
      const result = changeStoredJson(guest[field], (v) => stripPersonalKeys(v, true));
      if (result.changed) data[field] = result.value;
    }
    if (!Object.keys(data).length) continue;
    counts.guestsStripped++;
    if (!isDry) await prisma.guest.update({ where: { id: guest.id }, data });
  }

  // What this run would do, account by account: returned to an admin for
  // approval, never logged and never sent to the scheduled workflow.
  const teacherCount = (id: string) => teachersOf.get(id)?.size || 0;
  const toWarnIds = new Set(toWarn.map((a) => a.id));
  const preview = scheduled
    ? undefined
    : [
        ...toWarn.map((a) => ({ action: "warn", account: a })),
        ...notifyAbout
          .filter((a) => !toWarnIds.has(a.id))
          .map((a) => ({ action: "notifyTeachers", account: a })),
        ...due.slice(0, batch).map((a) => ({ action: "deidentify", account: a })),
      ].map(({ action, account }) => ({
        id: account.id,
        username: account.username,
        lastSignInAt: account.lastSignInAt,
        warnedAt: account.deidentificationWarnedAt,
        action,
        teachers: action === "deidentify" ? 0 : teacherCount(account.id),
      }));

  await context.sudo().db.RetentionRun.createOne({
    data: {
      trigger: scheduled ? "SCHEDULE" : "MANUAL",
      scope: "all DOE",
      dryRun: isDry,
      counts,
      startedAt,
      finishedAt: new Date(),
    },
  });
  return { dryRun: isDry, ...counts, ...(preview ? { accounts: preview } : {}) };
}

export default runDeidentification;
