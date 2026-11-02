// What counts as personal on an account and in its stored JSON, for
// de-identification (lib/purge/deidentify.ts). Field lists are derived from
// the Prisma schema, so a personal field added to Profile later is cleared
// by default rather than forgotten.

import { Prisma } from "@prisma/client";

/** Profile columns de-identification leaves alone or sets itself. */
const PROFILE_KEPT_SCALARS = new Set([
  "id",
  "type",
  "dateCreated",
  "lastSignInAt",
  "deidentifiedAt",
  "language",
  "profileType",
  // replaced with new values by deidentifyProfile
  "username",
  "email",
  "password",
  "publicId",
  "publicReadableId",
  // stripped of personal keys, not cleared: they hold study conditions,
  // consent decisions and progress the kept study data depends on
  "studiesInfo",
  "consentsInfo",
  "tasksInfo",
  // files, removed through Keystone so the stored file goes too
  "imageId",
  "introVideoFile_filesize",
  "introVideoFile_filename",
]);

/** Every other Profile column, with the value that clears it. */
export function profileClearedValues(): Record<string, unknown> {
  const profile = Prisma.dmmf.datamodel.models.find((m) => m.name === "Profile");
  const cleared: Record<string, unknown> = {};
  for (const field of profile?.fields || []) {
    if (field.kind === "object" || PROFILE_KEPT_SCALARS.has(field.name)) continue;
    if (!field.isRequired) cleared[field.name] = null;
    else if (field.type === "Boolean") cleared[field.name] = false;
    else if (field.type === "String") cleared[field.name] = "";
  }
  return cleared;
}

/**
 * Keys removed wherever they appear in an account's or participation
 * record's stored JSON, case-insensitively: what the join form asks for
 * (age, zip, NYU/SONA IDs, English status) and common identity keys.
 */
const PERSONAL_KEYS = new Set(
  [
    "age",
    "ageNum",
    "zip",
    "zipCode",
    "sona",
    "sonaId",
    "eng",
    "email",
    "name",
    "firstName",
    "lastName",
    "fullName",
    "username",
    "signature",
    "phone",
    "address",
    "birthday",
    "birthDate",
    "bd",
    "dob",
    "school",
  ].map((key) => key.toLowerCase())
);

/**
 * A copy of `value` without personal keys. With `dropInfo`, keys named
 * "info" are dropped whole: studiesInfo[studyId].info is the join form's
 * copy of the participant's details.
 */
export function stripPersonalKeys(value: unknown, dropInfo = false): unknown {
  if (Array.isArray(value)) return value.map((v) => stripPersonalKeys(v, dropInfo));
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    const lower = key.toLowerCase();
    if (PERSONAL_KEYS.has(lower) || (dropInfo && lower === "info")) continue;
    out[key] = stripPersonalKeys(inner, dropInfo);
  }
  return out;
}

/** JSON stored as text on SQLite and as JSON on Postgres. */
function parseStored(value: unknown): { parsed: unknown; wasText: boolean } {
  if (typeof value !== "string") return { parsed: value, wasText: false };
  try {
    return { parsed: JSON.parse(value), wasText: true };
  } catch {
    return { parsed: value, wasText: false };
  }
}

/** Applies `change` to a stored JSON value, keeping its storage form. */
export function changeStoredJson(
  value: unknown,
  change: (parsed: unknown) => unknown
): { value: unknown; changed: boolean } {
  if (value === null || value === undefined) return { value, changed: false };
  const { parsed, wasText } = parseStored(value);
  const next = change(parsed);
  const before = JSON.stringify(parsed);
  const after = JSON.stringify(next);
  if (before === after) return { value, changed: false };
  return { value: wasText ? after : next, changed: true };
}

/** Replaces every occurrence of each old code with its new code. */
export function replaceCodes(
  parsed: unknown,
  pairs: [string, string][]
): unknown {
  let text = JSON.stringify(parsed);
  if (text === undefined) return parsed;
  for (const [from, to] of pairs) {
    if (from) text = text.split(from).join(to);
  }
  return JSON.parse(text);
}
