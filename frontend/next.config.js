const path = require("path");

// Security headers applied to all responses.
// CSP uses unsafe-inline/unsafe-eval because TipTap, Pyodide, and dynamic
// visualisations require them. Tighten per-route once nonces are introduced.
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + Google OAuth + inline/eval needed by TipTap & Pyodide
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
      // Styles: self + inline (Emotion/Styled-Components) + Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com data:",
      // Images: self + data URIs + any HTTPS (Cloudinary, profile images, etc.)
      "img-src 'self' data: blob: https:",
      // Fetch/XHR: self + MindHive backends + Google auth
      "connect-src 'self' https://*.mindhive.science https://accounts.google.com https://apis.google.com wss://*.mindhive.science",
      // iframes for Google OAuth popup
      "frame-src 'self' https://accounts.google.com",
      // Workers needed by Pyodide
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
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
