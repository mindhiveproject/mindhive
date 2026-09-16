#!/usr/bin/env node
/**
 * Guards the surface registry in `lib/surfaces.js`.
 *
 * A ticket points at a surface key, so the registry has to stay an honest
 * description of what the product contains. Six ways it could quietly stop
 * being one, all of them failures here:
 *
 *   1. a page route exists that no surface covers   (new screen, unregistered)
 *   2. a surface names a route with no page file    (screen deleted or moved)
 *   3. a surface names a `root` that isn't on disk  (code moved)
 *   4. a router handles an `area` no surface claims (new area, unregistered)
 *   5. a `data-mh-surface` marker names an unknown key
 *   6. a surface exists that the resolver can never return (a silent hole)
 *
 * Run: node scripts/check-surfaces.mjs   (npm run lint:surfaces)
 */
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Loaded as a data: URL rather than by path. `lib/surfaces.js` is ESM but the
// package has no "type": "module" (and cannot get one — next.config.js is
// CommonJS), so importing it by path warns on every run. The module has no
// imports of its own, so evaluating it standalone is equivalent.
const surfacesSrc = readFileSync(join(ROOT, "lib/surfaces.js"), "utf8");
const { SURFACES, surfaceForRoute } = await import(
  `data:text/javascript;base64,${Buffer.from(surfacesSrc).toString("base64")}`
);

const problems = [];
const fail = (title, detail) => problems.push({ title, detail });

// ---- 1 & 2: routes -------------------------------------------------------

const PAGE_EXT = /\.(js|jsx|ts|tsx)$/;

/** Real route patterns, derived from the pages directory the way Next does. */
function pageRoutes(dir = join(ROOT, "pages"), prefix = "") {
  const routes = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "api") continue;
      routes.push(...pageRoutes(full, `${prefix}/${entry}`));
      continue;
    }
    if (!PAGE_EXT.test(entry)) continue;
    const base = entry.replace(PAGE_EXT, "");
    if (base === "_app" || base === "_document") continue;
    routes.push(base === "index" ? prefix || "/" : `${prefix}/${base}`);
  }
  return routes;
}

const realRoutes = new Set(pageRoutes());
const claimedRoutes = new Set(SURFACES.flatMap((s) => s.routes));

for (const route of [...realRoutes].sort()) {
  if (!claimedRoutes.has(route)) {
    fail("Page route with no surface", `${route} — add an entry to lib/surfaces.js`);
  }
}
for (const route of [...claimedRoutes].sort()) {
  if (!realRoutes.has(route)) {
    const owners = SURFACES.filter((s) => s.routes.includes(route)).map((s) => s.key);
    fail("Surface names a route that does not exist", `${route} — claimed by ${owners.join(", ")}`);
  }
}

// ---- 3: component roots --------------------------------------------------

for (const surface of SURFACES) {
  const base = join(ROOT, surface.root);
  const found =
    existsSync(base) ||
    [".js", ".jsx", ".ts", ".tsx"].some((ext) => existsSync(base + ext));
  if (!found) {
    fail("Surface root not on disk", `${surface.key} -> ${surface.root}`);
  }
}

// ---- 4: router areas -----------------------------------------------------

/** The `area === "x"` values a router actually branches on. Commented-out
 *  branches don't count — `Dashboard/Router.js` keeps a disabled "chats". */
function routerAreas(file) {
  const src = readFileSync(join(ROOT, file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
  const areas = new Set();
  for (const m of src.matchAll(/area\s*===\s*"([^"]+)"/g)) areas.add(m[1]);
  // `["tasks", "surveys"].includes(area)` — the array form
  for (const m of src.matchAll(/\[([^\]]*)\]\s*\.includes\(area\)/g)) {
    for (const q of m[1].matchAll(/"([^"]+)"/g)) areas.add(q[1]);
  }
  return areas;
}

const ROUTERS = [
  { file: "components/Dashboard/Router.js", prefix: "dashboard" },
  { file: "components/Builder/Router.js", prefix: "builder" },
];

for (const { file, prefix } of ROUTERS) {
  const handled = routerAreas(file);
  const claimed = new Set(
    SURFACES.filter((s) => s.key.startsWith(`${prefix}.`)).flatMap((s) => s.areas ?? [])
  );
  for (const area of [...handled].sort()) {
    if (!claimed.has(area)) {
      fail(
        `Router area with no surface`,
        `${file} handles area "${area}" — add it to a ${prefix}.* surface`
      );
    }
  }
  for (const area of [...claimed].sort()) {
    if (!handled.has(area)) {
      fail(
        `Surface claims an area the router does not handle`,
        `${prefix}: "${area}" — stale entry in lib/surfaces.js, or the router changed`
      );
    }
  }
}

// ---- 5: markers ----------------------------------------------------------

const SKIP = new Set(["node_modules", ".next", ".git", "out", "build", "public", "scripts"]);
const CODE_EXT = /\.(js|jsx|ts|tsx)$/;
const keys = new Set(SURFACES.map((s) => s.key));

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (CODE_EXT.test(entry)) out.push(full);
  }
  return out;
}

let markers = 0;
for (const file of walk(ROOT)) {
  const src = readFileSync(file, "utf8");
  if (!src.includes("data-mh-surface")) continue;
  for (const m of src.matchAll(/data-mh-surface=["{]["']?([a-z0-9.\-]+)["']?/g)) {
    markers++;
    if (!keys.has(m[1])) {
      const line = src.slice(0, m.index).split("\n").length;
      fail("Marker names an unknown surface", `${relative(ROOT, file)}:${line}  ${m[1]}`);
    }
  }
}

// ---- 6: every surface is reachable ---------------------------------------

// A surface nothing can resolve to is a hole: tickets could never be filed
// against it, and it would look registered while being unreachable. Feed each
// surface's own declaration back through the resolver and require it wins.
for (const surface of SURFACES) {
  for (const route of surface.routes) {
    // Only supply the params the route pattern actually has. A static route
    // like /dashboard/profile/create never carries an `area`, so a surface
    // that requires one cannot cover it — which is the bug this catches.
    const query = {};
    if (surface.areas && route.includes("[area]")) query.area = surface.areas[0];
    if (surface.selectors && route.includes("[selector]")) {
      query.selector = surface.selectors[0];
    }
    const got = surfaceForRoute(route, query);
    if (got?.key !== surface.key) {
      fail(
        "Surface is unreachable",
        `${surface.key} at ${route}` +
          `${query.area ? ` (area=${query.area})` : ""}` +
          `${query.selector ? ` (selector=${query.selector})` : ""}` +
          ` resolves to ${got ? got.key : "nothing"}`
      );
    }
  }
}

// ---- duplicate keys ------------------------------------------------------

const seen = new Set();
for (const s of SURFACES) {
  if (seen.has(s.key)) fail("Duplicate surface key", s.key);
  seen.add(s.key);
}

// ---- report --------------------------------------------------------------

if (problems.length) {
  const grouped = new Map();
  for (const { title, detail } of problems) {
    if (!grouped.has(title)) grouped.set(title, []);
    grouped.get(title).push(detail);
  }
  for (const [title, details] of grouped) {
    console.error(`\n${title} (${details.length})`);
    for (const detail of details) console.error(`    ${detail}`);
  }
  console.error(`\n✗ ${problems.length} surface problem${problems.length === 1 ? "" : "s"}.`);
  process.exit(1);
}

const withDesign = SURFACES.filter((s) => s.figmaNodeId).length;
console.log(
  `✓ ${SURFACES.length} surfaces cover ${realRoutes.size} routes; ` +
    `${markers} marker${markers === 1 ? "" : "s"}; ` +
    `${withDesign}/${SURFACES.length} have a Figma frame on record.`
);
