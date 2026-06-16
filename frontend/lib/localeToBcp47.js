const LOCALE_TO_BCP47 = {
  "en-us": "en-US",
  "es-es": "es-ES",
  "es-la": "es-419",
  "zh-cn": "zh-CN",
  "fr-fr": "fr-FR",
  "ar-ae": "ar-AE",
  "hi-in": "hi-IN",
  "hi-ma": "hi-IN",
  "ru-ru": "ru-RU",
  "nl-nl": "nl-NL",
  "pt-br": "pt-BR",
};

export function localeToBcp47(locale) {
  if (!locale) {
    return "en-US";
  }
  const normalized = String(locale).toLowerCase();
  if (LOCALE_TO_BCP47[normalized]) {
    return LOCALE_TO_BCP47[normalized];
  }
  const parts = normalized.split("-");
  if (parts.length === 2) {
    return `${parts[0]}-${parts[1].toUpperCase()}`;
  }
  return normalized;
}
