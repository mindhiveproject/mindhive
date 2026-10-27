// Admin tool for the DOE data agreement (de-identification policy: deletion
// on DOE's direction, when a school stops using MindHive, and termination).
// All of it needs the canDeleteDoeData permission.
//
//   doeExportPerson   one account's data, for a family's access request
//   doeExportSchool   every account of one school, to hand to DOE first
//   deleteDoeData     dry run by default; a real run must repeat a
//                     confirmation phrase (the email, the DBN, or
//                     "DELETE ALL DOE DATA"), is logged in RetentionRun with
//                     counts only, and searches the scope again afterwards.

import { normalizeDbn } from "../lib/doe/doe";
import { findDoeData, DoeScope } from "../lib/doe/findDoeData";
import { exportPerson } from "../lib/doe/exportPerson";
import { purgeDoeData } from "../lib/purge/purgeDoeData";

export const TERMINATION_PHRASE = "DELETE ALL DOE DATA";

function assertCanDelete(context: any) {
  const allowed = (context.session?.data?.permissions || []).some(
    (p: any) => p?.canDeleteDoeData
  );
  if (!allowed) throw new Error("Forbidden: canDeleteDoeData required.");
}

async function profileIdByEmail(prisma: any, email?: string | null) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return null;
  const profile = await prisma.profile.findFirst({
    where: { email: normalized },
    select: { id: true },
  });
  return profile?.id || null;
}

export async function doeExportPerson(
  root: any,
  { email, profileId }: { email?: string | null; profileId?: string | null },
  context: any
) {
  assertCanDelete(context);
  const id = profileId || (await profileIdByEmail(context.prisma, email));
  if (!id) throw new Error("No account with that email.");
  console.log("[doeExportPerson] one account exported");
  return exportPerson(context.prisma, id, { includeRawFiles: true });
}

export async function doeExportSchool(
  root: any,
  { school, includeRawFiles }: { school: string; includeRawFiles?: boolean | null },
  context: any
) {
  assertCanDelete(context);
  const dbn = normalizeDbn(school);
  const data = await findDoeData(context.prisma, { school: dbn });
  const people = [];
  for (const id of data.profileIds) {
    const person = await exportPerson(context.prisma, id, {
      includeRawFiles: !!includeRawFiles,
    });
    if (person) people.push(person);
  }
  console.log(`[doeExportSchool] ${people.length} accounts exported`);
  return { school: dbn, classes: data.classIds.length, people };
}

export async function deleteDoeData(
  root: any,
  {
    email,
    profileId,
    school,
    termination,
    dryRun,
    confirm,
  }: {
    email?: string | null;
    profileId?: string | null;
    school?: string | null;
    termination?: boolean | null;
    dryRun?: boolean | null;
    confirm?: string | null;
  },
  context: any
) {
  assertCanDelete(context);
  const prisma = context.prisma;
  const isDry = dryRun !== false;
  const chosen = [!!(email || profileId), !!school, !!termination].filter(Boolean);
  if (chosen.length !== 1) {
    throw new Error("Choose exactly one: a person, a school, or termination.");
  }

  let scope: DoeScope;
  let trigger: string;
  let scopeLabel: string;
  let phrase: string;
  if (termination) {
    scope = { all: true };
    trigger = "TERMINATION";
    scopeLabel = "all DOE";
    phrase = TERMINATION_PHRASE;
  } else if (school) {
    const dbn = normalizeDbn(school);
    scope = { school: dbn };
    trigger = "SCHOOL";
    scopeLabel = `school ${dbn}`;
    phrase = dbn;
  } else {
    const id = profileId || (await profileIdByEmail(prisma, email));
    if (!id) throw new Error("No account with that email.");
    scope = { profileId: id };
    trigger = "DOE_REQUEST";
    scopeLabel = "one person";
    phrase = String(email || profileId).trim().toLowerCase();
  }
  if (!isDry && String(confirm || "").trim().toLowerCase() !== phrase.toLowerCase()) {
    throw new Error(`To delete, type "${phrase}" to confirm.`);
  }

  const startedAt = new Date();
  const counts = await purgeDoeData(context, scope, {
    dryRun: isDry,
    termination: !!termination,
  });
  const verified =
    !isDry && Object.values(counts.remaining || {}).every((n) => n === 0);
  const run = await context.sudo().db.RetentionRun.createOne({
    data: {
      trigger,
      scope: scopeLabel,
      dryRun: isDry,
      counts,
      verified,
      startedAt,
      finishedAt: new Date(),
    },
  });
  return { runId: run.id, dryRun: isDry, scope: scopeLabel, verified, ...counts };
}
