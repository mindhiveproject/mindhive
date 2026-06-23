// i18n resolution for FormDefinition / FormCard / FormField text.
//
// Each translatable field has two columns: the plain `label` (English
// baseline) and a `labelI18n` json bag like {en: "...", es: "..."}.
// Resolution order: exact locale → language root (e.g. "en" from "en-us")
// → English → plain baseline → empty string.

function normalizeLocale(locale) {
  if (!locale || typeof locale !== "string") return "en";
  return locale.toLowerCase();
}

function pickFromBag(bag, locale) {
  if (!bag || typeof bag !== "object") return null;
  const wanted = normalizeLocale(locale);
  if (bag[wanted]) return bag[wanted];
  const root = wanted.split("-")[0];
  if (bag[root]) return bag[root];
  // Common stored forms: "en", "en-US", "EN-US"
  const upperHyphen = wanted.toUpperCase();
  if (bag[upperHyphen]) return bag[upperHyphen];
  if (bag.en) return bag.en;
  if (bag["en-us"]) return bag["en-us"];
  if (bag["EN-US"]) return bag["EN-US"];
  return null;
}

export function pickText(plain, bag, locale) {
  const fromBag = pickFromBag(bag, locale);
  if (fromBag != null && fromBag !== "") return fromBag;
  return plain || "";
}

export function fieldLabel(field, locale) {
  return pickText(field?.label, field?.labelI18n, locale);
}

export function fieldHelper(field, locale) {
  return pickText(field?.helperText, field?.helperTextI18n, locale);
}

export function fieldPlaceholder(field, locale) {
  return pickText(field?.placeholder, field?.placeholderI18n, locale);
}

export function cardTitle(card, locale) {
  return pickText(card?.title, card?.titleI18n, locale);
}

export function cardDescription(card, locale) {
  return pickText(card?.description, card?.descriptionI18n, locale);
}

// For select / multiselect options. Each option is {value, label, labelI18n, order}.
export function optionLabel(option, locale) {
  return pickText(option?.label, option?.labelI18n, locale);
}
