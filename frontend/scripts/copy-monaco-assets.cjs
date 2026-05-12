/**
 * Copy monaco-editor/min/vs into public/ so @monaco-editor/loader can use same-origin paths
 * (avoids CSP blocking cdn.jsdelivr.net for style-src / workers).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = path.join(root, "node_modules", "monaco-editor", "min", "vs");
const dest = path.join(root, "public", "monaco-editor", "vs");

if (!fs.existsSync(src)) {
  console.warn(
    "[copy-monaco-assets] skip: monaco-editor min/vs not found at",
    src,
  );
  process.exit(0);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(src, dest, { recursive: true });
console.log("[copy-monaco-assets] copied to", dest);
