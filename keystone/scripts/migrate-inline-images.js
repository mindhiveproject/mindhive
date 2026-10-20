/**
 * One-off migration: move images that are embedded as base64 `data:image/...`
 * URIs inside card, assignment and resource content out into files, and
 * replace each one with a link to the file.
 *
 * Embedded images made some cards several MB of text, so every load, save,
 * board copy and template propagation of those cards moved megabytes through
 * the backend and stalled it for everyone (incident of 2026-10-19).
 *
 * Images are written once per distinct image (named by content hash) to
 * media-library/inline-migrated/, which the backend already serves under
 * /media-library. No MediaAsset rows are created: a file shared by many rows
 * (template copies) must not be deleted when one MediaAsset is deleted.
 * SVG data URIs are left in place (serving uploaded SVG is a script risk).
 *
 * Run from the keystone directory. It is a dry run unless --apply is given:
 *
 *   DATABASE_URL=... ASSET_BASE_URL=https://... node scripts/migrate-inline-images.js
 *   ... node scripts/migrate-inline-images.js --id=<cardId>[,<id>...] --apply
 *   ... node scripts/migrate-inline-images.js --apply
 *   ... node scripts/migrate-inline-images.js --restore=<backup.jsonl>
 *
 * --apply writes the original values of every changed row to
 * inline-image-backup-<timestamp>.jsonl first; --restore puts them back.
 * The script is idempotent: migrated rows have no data URIs left to match.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { PrismaClient } = require("@prisma/client");

const args = process.argv.slice(2);
const argValue = (name) => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3) : null;
};
const isApply = args.includes("--apply");
const onlyIds = (argValue("id") || "").split(",").filter(Boolean);
const restoreFile = argValue("restore");
const baseUrl = (argValue("base-url") || process.env.ASSET_BASE_URL || "").replace(/\/$/, "");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Set it to the database you want to migrate.");
  process.exit(1);
}
if (isApply && !/^https?:\/\//.test(baseUrl)) {
  // Card HTML is rendered on the frontend domain, so a relative
  // /media-library/... link would point at the wrong host.
  console.error("--apply needs an absolute ASSET_BASE_URL (or --base-url=https://...).");
  process.exit(1);
}

const OUT_DIR = path.join(__dirname, "..", "media-library", "inline-migrated");
const URL_PREFIX = `${baseUrl}/media-library/inline-migrated`;

// The base64 must end right before a quote, ")" or an escape (`\"` in JSON,
// `&quot;` in HTML), so a URI broken by whitespace is never half-replaced.
const DATA_URI = /data:image\/(png|jpe?g|gif|webp);base64,([A-Za-z0-9+/]+={0,2})(?=["'\\)&])/g;
const EXTENSIONS = { png: "png", jpg: "jpg", jpeg: "jpg", gif: "gif", webp: "webp" };

// Text fields are strings; JSON fields are objects in Postgres and strings
// in the SQLite dev database.
const TABLES = [
  {
    name: "ProposalCard",
    model: "proposalCard",
    textFields: ["content", "revisedContent", "internalContent", "comment", "description"],
    jsonFields: ["previousEntries"],
  },
  { name: "Assignment", model: "assignment", textFields: ["content", "placeholder"], jsonFields: [] },
  { name: "Resource", model: "resource", textFields: [], jsonFields: ["content"] },
];

const stats = {
  rows: {},
  images: 0,
  bytesBefore: 0,
  bytesAfter: 0,
  filesWritten: 0,
  unchangedDataUris: 0,
};
const seenHashes = new Set();

function storeImage(type, base64) {
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) return null;
  const hash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 32);
  const fileName = `${hash}.${EXTENSIONS[type]}`;
  if (!seenHashes.has(hash)) {
    seenHashes.add(hash);
    const filePath = path.join(OUT_DIR, fileName);
    if (isApply && !fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, buffer);
      stats.filesWritten += 1;
    }
  }
  return `${URL_PREFIX}/${fileName}`;
}

function replaceDataUris(text) {
  let count = 0;
  const result = text.replace(DATA_URI, (match, type, base64) => {
    const url = storeImage(type.toLowerCase(), base64);
    if (!url) return match;
    count += 1;
    return url;
  });
  stats.unchangedDataUris += (result.match(/data:image\//g) || []).length;
  return { result, count };
}

// Returns { data, original } with only the fields that changed, or null.
function migrateRow(table, row) {
  const data = {};
  const original = {};
  let images = 0;

  for (const field of table.textFields) {
    const value = row[field];
    if (typeof value !== "string" || !value.includes("data:image")) continue;
    const { result, count } = replaceDataUris(value);
    if (count === 0) continue;
    data[field] = result;
    original[field] = value;
    images += count;
    stats.bytesBefore += value.length;
    stats.bytesAfter += result.length;
  }

  for (const field of table.jsonFields) {
    const value = row[field];
    if (value === null || value === undefined) continue;
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    if (!serialized.includes("data:image")) continue;
    const { result, count } = replaceDataUris(serialized);
    if (count === 0) continue;
    data[field] = typeof value === "string" ? result : JSON.parse(result);
    original[field] = value;
    images += count;
    stats.bytesBefore += serialized.length;
    stats.bytesAfter += result.length;
  }

  if (images === 0) return null;

  // The collab server would otherwise restore the old content from its saved
  // Yjs state; "" makes the browser re-seed the editor from the new HTML.
  if (table.name === "ProposalCard" && row.yjsState) {
    data.yjsState = "";
    original.yjsState = row.yjsState;
  }

  stats.images += images;
  return { data, original };
}

async function findCandidateIds(prisma, table) {
  if (onlyIds.length) {
    const rows = await prisma[table.model].findMany({
      where: { id: { in: onlyIds } },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
  const ids = new Set();
  if (table.textFields.length) {
    const rows = await prisma[table.model].findMany({
      where: { OR: table.textFields.map((f) => ({ [f]: { contains: "data:image" } })) },
      select: { id: true },
    });
    rows.forEach((r) => ids.add(r.id));
  }
  // JSON columns cannot be searched portably, so scan them in pages.
  for (const field of table.jsonFields) {
    let cursor;
    for (;;) {
      const page = await prisma[table.model].findMany({
        take: 500,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: "asc" },
        select: { id: true, [field]: true },
      });
      if (page.length === 0) break;
      for (const r of page) {
        const v = r[field];
        if (v && (typeof v === "string" ? v : JSON.stringify(v)).includes("data:image")) {
          ids.add(r.id);
        }
      }
      cursor = page[page.length - 1].id;
    }
  }
  return [...ids];
}

async function migrate(prisma) {
  let backup = null;
  if (isApply) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const backupPath = path.join(
      process.cwd(),
      `inline-image-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`
    );
    backup = fs.openSync(backupPath, "a");
    console.log(`Backup of original values: ${backupPath}`);
  }

  for (const table of TABLES) {
    const ids = await findCandidateIds(prisma, table);
    let changed = 0;
    const select = { id: true, title: true };
    [...table.textFields, ...table.jsonFields].forEach((f) => (select[f] = true));
    if (table.name === "ProposalCard") select.yjsState = true;

    for (const id of ids) {
      const row = await prisma[table.model].findUnique({ where: { id }, select });
      if (!row) continue;
      const migrated = migrateRow(table, row);
      if (!migrated) continue;
      changed += 1;
      const kbBefore = Object.values(migrated.original)
        .map((v) => (typeof v === "string" ? v : JSON.stringify(v)).length)
        .reduce((a, b) => a + b, 0);
      console.log(
        `${isApply ? "updating" : "would update"} ${table.name} ${id} "${String(row.title || "").slice(0, 40)}" (${Math.round(kbBefore / 1024)} KB)`
      );
      if (isApply) {
        // Backup first, so a failed update can still be restored.
        fs.writeSync(
          backup,
          `${JSON.stringify({ table: table.name, model: table.model, id, fields: migrated.original })}\n`
        );
        await prisma[table.model].update({ where: { id }, data: migrated.data });
      }
    }
    stats.rows[table.name] = changed;
  }

  if (backup !== null) fs.closeSync(backup);

  const mb = (n) => (n / 1048576).toFixed(1);
  console.log("\nSummary", isApply ? "(applied)" : "(dry run, nothing written)");
  console.log("  rows changed:", stats.rows);
  console.log(`  images replaced: ${stats.images}, distinct: ${seenHashes.size}, files written: ${stats.filesWritten}`);
  console.log(`  changed fields: ${mb(stats.bytesBefore)} MB -> ${mb(stats.bytesAfter)} MB`);
  if (stats.unchangedDataUris) {
    console.log(`  data:image URIs left in place (SVG or unusual format): ${stats.unchangedDataUris}`);
  }
}

async function restore(prisma) {
  const lines = readline.createInterface({ input: fs.createReadStream(restoreFile) });
  let restored = 0;
  for await (const line of lines) {
    if (!line.trim()) continue;
    const { model, table, id, fields } = JSON.parse(line);
    await prisma[model].update({ where: { id }, data: fields });
    restored += 1;
    console.log(`restored ${table} ${id}`);
  }
  console.log(`\nRestored ${restored} rows. Image files were left in place.`);
}

async function main() {
  const prisma = new PrismaClient();
  try {
    if (restoreFile) await restore(prisma);
    else await migrate(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
