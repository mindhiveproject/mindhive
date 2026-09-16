#!/usr/bin/env node
/**
 * Guards the design-token layer.
 *
 * `--MH-Theme-*` properties are written at call sites with an inline fallback:
 *
 *     color: var(--MH-Theme-Primary-Dark, #336f8a);
 *
 * The fallback keeps a component readable on its own, but it also means a
 * missing or disagreeing definition fails silently — which is exactly how the
 * token layer came to be referenced 969 times and defined zero times. This
 * script makes both failures loud:
 *
 *   1. every referenced token is defined in Theme.css
 *   2. every fallback equals its definition (ignoring case and whitespace)
 *
 * Run: node scripts/check-tokens.mjs   (wired into `npm run lint`)
 */
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const THEME = join(ROOT, "components/DesignSystem/Theme.css");
const SKIP = new Set(["node_modules", ".next", ".git", "out", "build", "public"]);
const EXT = /\.(js|jsx|ts|tsx|css)$/;
const PREFIX = "--MH-Theme-";

/** Same colour, different notation: #FFF, #ffffff and rgba spacing all agree. */
function normalize(value) {
  if (value == null) return value;
  const flat = value.trim().toLowerCase().replace(/\s+/g, " ").replace(/,\s*/g, ",");
  const short = flat.match(/^#([0-9a-f]{3})$/);
  return short ? "#" + short[1].split("").map((c) => c + c).join("") : flat;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXT.test(entry)) out.push(full);
  }
  return out;
}

/** Every `var(--MH-Theme-…)` in a file, with its fallback. Walks characters
 *  rather than regexing, because fallbacks nest parens: rgba(), shadow lists. */
function* varCalls(src) {
  const needle = `var(${PREFIX}`;
  let i = 0;
  while ((i = src.indexOf(needle, i)) !== -1) {
    const open = i + 3;
    let depth = 0;
    let end = -1;
    for (let j = open; j < src.length; j++) {
      if (src[j] === "(") depth++;
      else if (src[j] === ")") {
        depth--;
        if (depth === 0) { end = j; break; }
      }
    }
    if (end === -1) { i += needle.length; continue; }
    const inner = src.slice(open + 1, end);
    const comma = inner.indexOf(",");
    yield {
      name: (comma === -1 ? inner : inner.slice(0, comma)).trim(),
      fallback: comma === -1 ? null : inner.slice(comma + 1).trim(),
      line: src.slice(0, i).split("\n").length,
      text: src.slice(i, end + 1),
    };
    i = end;
  }
}

const themeSrc = readFileSync(THEME, "utf8");
const defined = new Map();
for (const m of themeSrc.matchAll(/(--MH-Theme-[A-Za-z0-9-]+)\s*:\s*([^;]+);/g)) {
  defined.set(m[1], m[2].trim());
}

const undefinedTokens = [];
const mismatches = [];
const noFallback = [];
const used = new Set();

for (const file of walk(ROOT)) {
  if (file === THEME) continue;
  const rel = relative(ROOT, file);
  for (const call of varCalls(readFileSync(file, "utf8"))) {
    used.add(call.name);
    const definition = defined.get(call.name);
    if (definition === undefined) {
      undefinedTokens.push(`${rel}:${call.line}  ${call.name}`);
      continue;
    }
    if (call.fallback == null) {
      noFallback.push(`${rel}:${call.line}  ${call.name}`);
      continue;
    }
    if (normalize(call.fallback) !== normalize(definition)) {
      mismatches.push(
        `${rel}:${call.line}  ${call.name}\n      fallback   ${call.fallback}\n      Theme.css  ${definition}`
      );
    }
  }
}

const report = (title, items, hint) => {
  if (!items.length) return;
  console.error(`\n${title} (${items.length})`);
  if (hint) console.error(`  ${hint}`);
  for (const item of items) console.error(`    ${item}`);
};

report(
  "Tokens used but not defined in Theme.css",
  undefinedTokens,
  "Add a definition, or point the call site at a token that holds its value."
);
report(
  "Fallback disagrees with Theme.css",
  mismatches,
  "The definition wins at runtime, so this fallback is a lie. Fix whichever is wrong."
);
report(
  "Token used with no fallback",
  noFallback,
  "Write the fallback too: var(--MH-Theme-Name, #value)."
);

const unused = [...defined.keys()].filter((name) => !used.has(name));
if (unused.length) {
  console.log(`\nDefined but unused (${unused.length}) — not an error, just housekeeping:`);
  for (const name of unused) console.log(`    ${name}: ${defined.get(name)}`);
}

const failures = undefinedTokens.length + mismatches.length + noFallback.length;
if (failures > 0) {
  console.error(`\n✗ ${failures} token problem${failures === 1 ? "" : "s"}.`);
  process.exit(1);
}
console.log(`\n✓ ${used.size} tokens used, ${defined.size} defined, every fallback agrees.`);
