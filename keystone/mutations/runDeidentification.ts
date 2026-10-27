import { createHash, timingSafeEqual } from "crypto";

import { findDoeData } from "../lib/doe/findDoeData";
import { deidentifyProfile } from "../lib/purge/deidentify";
import { changeStoredJson, stripPersonalKeys } from "../lib/purge/personal";
import { sendNotificationEmail } from "../lib/mail";
import { getRetentionSettings } from "./retentionSettings";

// The monthly DOE de-identification job (de-identification policy: "When
// data is de-identified or deleted"). For DOE accounts only:
//   1. no sign-in for 23 months and no warning yet -> warning email, and
//      deidentificationWarnedAt is set (a sign-in clears it, auth.ts);
//   2. no sign-in for two years and warned at least 30 days ago ->
//      lib/purge/deidentify. Accounts past two years on the first run (the
//      backfill dated many) are warned first and de-identified a month later.
//   3. guests in DOE studies whose participation is over two years old ->
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
//   - an admin's dry run returns the accounts it would warn or de-identify,
//     and an admin's real run must name the accounts it approves
//     (profileIds): only those that are still due are acted on.

const DAY_MS = 24 * 60 * 60 * 1000;
const TWO_YEARS_MS = 730 * DAY_MS;
const WARNING_MS = 30 * DAY_MS;
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
    deidentified: 0,
    dueLeftForNextRun: Math.max(0, due.length - batch),
    deidentification: {},
    guestsStripped: 0,
  };

  // What this run would do, account by account: returned to an admin for
  // approval, never logged and never sent to the scheduled workflow.
  const preview = scheduled
    ? undefined
    : [
        ...toWarn.map((a) => ({ action: "warn", account: a })),
        ...due.slice(0, batch).map((a) => ({ action: "deidentify", account: a })),
      ].map(({ action, account }) => ({
        id: account.id,
        username: account.username,
        lastSignInAt: account.lastSignInAt,
        warnedAt: account.deidentificationWarnedAt,
        action,
      }));

  // 1. Warnings.
  const loginUrl = `${process.env.FRONTEND_URL || "https://mindhive.science"}/login`;
  for (const account of toWarn) {
    const date = new Date(
      Math.max(account.lastSignInAt.getTime() + TWO_YEARS_MS, now + WARNING_MS)
    ).toISOString().slice(0, 10);
    if (!canEmail(account.email)) {
      counts.warnedWithoutEmail++;
    } else if (!isDry) {
      try {
        await sendNotificationEmail(
          account.email,
          "Your MindHive account will be de-identified",
          `You have not signed in to MindHive for almost two years. On ${date}, ` +
            "your account will be de-identified: your name, email address and " +
            "other personal details will be deleted, and your account will no " +
            "longer be linked to you. To keep your account, sign in before then.",
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
  }

  // 2. De-identification, one account at a time.
  for (const account of due.slice(0, batch)) {
    const result = await deidentifyProfile(context, account.id, { dryRun: isDry });
    if (result.skipped) continue;
    counts.deidentified++;
    const { skipped, ...numbers } = result;
    sum(counts.deidentification, numbers);
  }

  // 3. Guests in DOE studies, after two years.
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
