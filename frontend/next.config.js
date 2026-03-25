const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    // Plotly imports maplibre-gl global CSS from inside node_modules; Next rejects any CSS
    // in that dependency graph. Resolve the CSS request to a no-op JS module instead.
    config.resolve.alias = {
      ...config.resolve.alias,
      "maplibre-gl/dist/maplibre-gl.css": path.resolve(
        __dirname,
        "lib/maplibreGlPlotlyCssNoop.js"
      ),
    };
    return config;
  },
  i18n: {
    locales: [
      "en-us",
      "es-es",
      "es-la",
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
