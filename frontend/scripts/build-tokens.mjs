#!/usr/bin/env node
/**
 * Generate design-tokens.json from the CSS that actually renders.
 *
 * Stage 4 pushes tokens up to Figma, and every route that can do that — the
 * Figma MCP server, Tokens Studio, a hand-written plugin — consumes the same
 * thing: a W3C Design Tokens document. This builds it from Theme.css and
 * Typography.css so the export cannot disagree with the product.
 *
 * Note for whoever wires up the push: the Variables REST API cannot create or
 * update variables outside an Enterprise org (POST /v1/files/:key/variables is
 * Enterprise-only). The Plugin API has no such restriction, and the Figma MCP
 * server can write variables during the beta. So this file is the input to one
 * of those, not to a REST call.
 *
 *   node scripts/build-tokens.mjs            # write design-tokens.json
 *   node scripts/build-tokens.mjs --check    # fail if it is out of date
 *
 * The --check mode is what keeps this honest: regenerate, compare, and fail if
 * someone changed Theme.css without rebuilding. Same job as check-tokens.mjs,
 * one layer further out.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const THEME = join(ROOT, "components/DesignSystem/Theme.css");
const TYPE = join(ROOT, "components/DesignSystem/Typography.css");
const OUT = join(ROOT, "design-tokens.json");

/** Longest-first so "Additional-Accent" wins over "Accent". */
const GROUPS = [
  "Additional-Accent",
  "Neutrals",
  "Elevation",
  "Primary",
  "Secondary",
  "Tertiary",
  "Accent",
  "Success",
  "Warning",
  "Danger",
  "Error",
];

/** `--MH-Theme-Neutrals-Light` -> { group: "Neutrals", step: "Light" } */
function split(name) {
  const bare = name.replace(/^--MH-Theme-/, "");
  const group = GROUPS.find((g) => bare === g || bare.startsWith(`${g}-`));
  if (!group) return { group: "Other", step: bare };
  const step = bare.slice(group.length).replace(/^-/, "") || "Base";
  return { group, step };
}

const declarations = (file, prefix) => {
  const src = readFileSync(file, "utf8");
  // Only the :root block — ignore the class rules further down Typography.css.
  const root = src.slice(src.indexOf(":root"), src.indexOf("}", src.indexOf(":root")));
  return [...root.matchAll(new RegExp(`(${prefix}[A-Za-z0-9-]+)\\s*:\\s*([^;]+);`, "g"))].map(
    (m) => [m[1], m[2].trim()]
  );
};

const tokens = { $description: "Generated from Theme.css and Typography.css — do not edit by hand." };

/* ---- colour and elevation ---------------------------------------------- */

for (const [name, value] of declarations(THEME, "--MH-Theme-")) {
  const { group, step } = split(name);
  const isShadow = group === "Elevation";
  const bucket = isShadow ? "shadow" : "color";
  tokens[bucket] ??= {};
  tokens[bucket][group] ??= {};
  tokens[bucket][group][step] = {
    // W3C's shadow type wants a structured object; these are CSS box-shadow
    // lists and every consumer here accepts the string, so it stays verbatim
    // rather than being parsed into something that could drift.
    $type: isShadow ? "shadow" : "color",
    $value: value,
    $extensions: { "science.mindhive.cssVariable": name },
  };
}

/* ---- typography --------------------------------------------------------- */

// `600 46px/52px "Inter", sans-serif` — the shorthand Typography.css uses so a
// single declaration sets weight, size, line height and family at once.
const FONT = /^(\d+)\s+(\d+px)\/(\d+px)\s+(.+)$/;

for (const [name, value] of declarations(TYPE, "--MH-Type-")) {
  const bare = name.replace(/^--MH-Type-/, "");
  const [role, size] = bare.split("-");
  const match = value.match(FONT);
  tokens.typography ??= {};
  tokens.typography[role] ??= {};
  tokens.typography[role][size] = {
    $type: "typography",
    $value: match
      ? {
          fontWeight: Number(match[1]),
          fontSize: match[2],
          lineHeight: match[3],
          fontFamily: match[4].replace(/"/g, ""),
          letterSpacing: "0",
        }
      : value,
    $extensions: { "science.mindhive.cssVariable": name },
  };
}

/* ---- write or check ----------------------------------------------------- */

const serialised = `${JSON.stringify(tokens, null, 2)}\n`;
const counts = {
  colour: Object.values(tokens.color ?? {}).reduce((n, g) => n + Object.keys(g).length, 0),
  shadow: Object.values(tokens.shadow ?? {}).reduce((n, g) => n + Object.keys(g).length, 0),
  type: Object.values(tokens.typography ?? {}).reduce((n, g) => n + Object.keys(g).length, 0),
};

if (process.argv.includes("--check")) {
  if (!existsSync(OUT)) {
    console.error("✗ design-tokens.json is missing. Run: npm run tokens:build");
    process.exit(1);
  }
  if (readFileSync(OUT, "utf8") !== serialised) {
    console.error(
      "✗ design-tokens.json is out of date with Theme.css / Typography.css.\n" +
        "  Run: npm run tokens:build"
    );
    process.exit(1);
  }
  console.log(
    `✓ design-tokens.json matches the CSS — ${counts.colour} colours, ${counts.shadow} shadows, ${counts.type} type styles.`
  );
} else {
  writeFileSync(OUT, serialised);
  console.log(
    `✓ design-tokens.json — ${counts.colour} colours, ${counts.shadow} shadows, ${counts.type} type styles.`
  );
}
