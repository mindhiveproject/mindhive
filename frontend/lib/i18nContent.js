// Helpers for a task's per-locale `i18nContent` ({ "en-us": { title, ... } }).

export const FALLBACK_LOCALE = "en-us";

// Text fields copied from the base task into the fallback locale when blank.
const BASE_TEXT_FIELDS = ["title", "description", "descriptionForParticipants"];

const isBlank = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

// Resolve a field for `locale`, falling back to en-us and then to the base
// task field. Blank strings count as missing so an untranslated title never
// hides the base title.
export function getLocalizedField(task, field, locale) {
  const content = task?.i18nContent;
  for (const lang of [locale, FALLBACK_LOCALE]) {
    const value = content?.[lang]?.[field];
    if (!isBlank(value)) return value;
  }
  return task?.[field];
}

// Recursively drop blank strings and nulls; returns undefined when nothing is left.
function stripBlank(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const out = {};
    Object.entries(value).forEach(([key, inner]) => {
      const cleaned = stripBlank(inner);
      if (cleaned !== undefined) out[key] = cleaned;
    });
    return Object.keys(out).length ? out : undefined;
  }
  return isBlank(value) ? undefined : value;
}

// Prepare `i18nContent` for saving: drop blank fields and empty locales, and
// seed the fallback locale's text fields from the base task when missing.
export function cleanI18nContent(task) {
  const cleaned = stripBlank(task?.i18nContent) || {};
  const fallback = { ...cleaned[FALLBACK_LOCALE] };
  BASE_TEXT_FIELDS.forEach((field) => {
    if (isBlank(fallback[field]) && !isBlank(task?.[field])) {
      fallback[field] = task[field];
    }
  });
  if (Object.keys(fallback).length) cleaned[FALLBACK_LOCALE] = fallback;
  return cleaned;
}
