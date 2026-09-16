#!/usr/bin/env node
/**
 * Validates gql documents against the backend's real schema.
 *
 * Apollo sends a query to the server before anything checks it against the
 * schema, so a mismatch — a renamed field, a nullable variable in a non-null
 * position — surfaces as a runtime error on the one click that happens to use
 * it. This turns that into a check you can run.
 *
 * Needs a running backend to introspect. Skips (exit 0) when it cannot reach
 * one, so it never blocks work offline.
 *
 *   node scripts/check-graphql.mjs                      # Queries/ and Mutations/
 *   node scripts/check-graphql.mjs components/Queries/Ticket.js
 *   BACKEND=https://staging-backend.example/api/graphql node scripts/check-graphql.mjs
 *
 * Not wired into `npm run lint`: 8 documents in Queries/ and Mutations/ do not
 * currently validate. All are dead — imported by no file — and six of them
 * reference a `User` list the schema does not have (it is `Profile`), so they
 * would fail if anything ever called them. Delete those and this can become a
 * gate rather than a report.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(ROOT, "package.json"));
const { getIntrospectionQuery, buildClientSchema, parse, validate } = require("graphql");

const ENDPOINT =
  process.env.BACKEND ||
  process.env.NEXT_PUBLIC_BACKEND_URL_GRAPHQL ||
  "http://localhost:4444/api/graphql";

/* ---- collecting documents ---------------------------------------------- */

/**
 * Find each gql`…` template literal, honouring escapes and `${…}`
 * interpolations so a document containing either is read whole rather than
 * truncated at the first backtick inside it.
 */
function extractDocuments(src) {
  const docs = [];
  const needle = "gql`";
  let i = 0;

  while ((i = src.indexOf(needle, i)) !== -1) {
    // Commented-out documents are not documents. User.js keeps a disabled
    // `// export const … = gql\`` block that would otherwise read as a parse
    // error in a query nobody ships.
    const lineStart = src.lastIndexOf("\n", i) + 1;
    if (src.slice(lineStart, i).includes("//")) {
      i += needle.length;
      continue;
    }

    const start = i + needle.length;
    let j = start;
    let end = -1;

    while (j < src.length) {
      const char = src[j];
      if (char === "\\") {
        j += 2;
        continue;
      }
      if (char === "$" && src[j + 1] === "{") {
        // Skip the interpolation, counting braces so nested ones survive.
        let depth = 1;
        j += 2;
        while (j < src.length && depth > 0) {
          if (src[j] === "{") depth++;
          else if (src[j] === "}") depth--;
          j++;
        }
        continue;
      }
      if (char === "`") {
        end = j;
        break;
      }
      j++;
    }
    if (end === -1) break;

    const text = src.slice(start, end);
    docs.push({
      name: text.match(/(?:query|mutation|subscription)\s+(\w+)/)?.[1] ?? "(anonymous)",
      text,
      line: src.slice(0, i).split("\n").length,
    });
    i = end + 1;
  }
  return docs;
}

/** Inline `${NAME}` where NAME is a template-literal constant in the same file. */
function resolveInterpolations(text, src) {
  return text.replace(/\$\{\s*(\w+)\s*\}/g, (whole, name) => {
    const constant = src.match(new RegExp(`const\\s+${name}\\s*=\\s*\`([\\s\\S]*?)\``));
    return constant ? constant[1] : whole;
  });
}

function defaultFiles() {
  const dirs = ["components/Queries", "components/Mutations"].map((d) => join(ROOT, d));
  const files = [];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isFile() && /\.(js|jsx|ts|tsx)$/.test(entry)) files.push(full);
    }
  }
  return files;
}

/* ---- schema ------------------------------------------------------------- */

let schema;
try {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: getIntrospectionQuery() }),
    signal: AbortSignal.timeout(8000),
  });
  const { data, errors } = await response.json();
  if (errors) throw new Error(JSON.stringify(errors).slice(0, 300));
  schema = buildClientSchema(data);
} catch (reason) {
  console.log(`- Skipping GraphQL validation: could not introspect ${ENDPOINT}`);
  console.log(`  (${reason.message}). Start the backend, or set BACKEND=<url>.`);
  process.exit(0);
}

/* ---- validate ----------------------------------------------------------- */

const files = process.argv.slice(2).length
  ? process.argv.slice(2).map((f) => resolve(f))
  : defaultFiles();

let checked = 0;
let skipped = 0;
const failures = [];

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);

  for (const doc of extractDocuments(src)) {
    const text = resolveInterpolations(doc.text, src);

    // A document still carrying an interpolation is assembled from something
    // this script cannot see. Report it as skipped rather than as broken.
    if (/\$\{/.test(text)) {
      skipped++;
      continue;
    }

    checked++;
    let ast;
    try {
      ast = parse(text);
    } catch (parseError) {
      failures.push({ rel, doc, messages: [`parse error: ${parseError.message}`] });
      continue;
    }
    const problems = validate(schema, ast);
    if (problems.length) {
      failures.push({ rel, doc, messages: problems.map((p) => p.message) });
    }
  }
}

for (const { rel, doc, messages } of failures) {
  console.error(`\n✗ ${doc.name}  (${rel}:${doc.line})`);
  for (const message of messages) console.error(`    ${message}`);
}

const passed = checked - failures.length;
console.log(
  `\n${passed}/${checked} documents validate against ${ENDPOINT}` +
    (skipped ? ` (${skipped} skipped: assembled at runtime)` : "")
);

process.exit(failures.length ? 1 : 0);
