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
      // cdn.plot.ly: Plotly charting library
      // cdn.jsdelivr.net: Pyodide WASM runtime
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://cdn.plot.ly https://cdn.jsdelivr.net",
      // Styles: self + inline (Emotion/Styled-Components) + Google Fonts
      // cdnjs.cloudflare.com: Semantic UI CSS
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      // Fonts: Google Fonts + Semantic UI ships woff/woff2 from cdnjs
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
      // Images: self + data URIs + any HTTPS (Cloudinary, profile images, etc.)
      "img-src 'self' http://localhost:4444 data: blob: https:",
      // Fetch/XHR: self + MindHive backends + Google auth
      // cdn.jsdelivr.net: Pyodide fetches .wasm and package files at runtime
      // pypi.org: Pyodide micropip queries PyPI to resolve Python package metadata
      // files.pythonhosted.org: Pyodide micropip downloads wheel files from here
      "connect-src 'self' http://localhost:4444 https://*.mindhive.science https://accounts.google.com https://apis.google.com wss://*.mindhive.science https://cdn.jsdelivr.net https://pypi.org https://files.pythonhosted.org https://api.cloudinary.com",
      // iframes for Google OAuth popup
      "frame-src 'self' https://accounts.google.com https://www.youtube.com https://www.youtube-nocookie.com",
      // Workers needed by Pyodide (blob: for inline workers, cdn.jsdelivr.net for Pyodide worker scripts)
      "worker-src 'self' blob: https://cdn.jsdelivr.net",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Non-production: browser Apollo uses same-origin /api/graphql (see config.js). Proxy to Keystone.
  // `npm run dev` runs `node server` without NODE_ENV=development; rewrites must still apply.
  // Omit when NODE_ENV=production — client uses https://backend.mindhive.science via withData.js.
  async rewrites() {
    if (process.env.NODE_ENV === "production") {
      return [];
    }
    return [
      {
        source: "/api/graphql",
        destination: "http://localhost:4444/api/graphql",
      },
    ];
  },
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
        "lib/maplibreGlPlotlyCssNoop.js",
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
