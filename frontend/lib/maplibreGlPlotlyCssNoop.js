/**
 * plotly.js imports maplibre-gl CSS from node_modules; Next.js rejects that graph.
 * Webpack resolves the CSS request to this module instead. Real styles: maplibre-gl-vendor.css in pages/_app.js
 */
export {};
