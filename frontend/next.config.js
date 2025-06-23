/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: [
      "en-us",
      "es-es",
      "zh-cn",
      "fr-fr",
      "ar-ae",
      "hi-in",
      "hi-ma",
      "ru-ru",
      "nl-nl",
      "pt-br",
    ],
    defaultLocale: "en-us",
    localeDetection: true,
  },
};

const nextTranslate = require("next-translate-plugin");

// module.exports = nextConfig
module.exports = nextTranslate(nextConfig);
