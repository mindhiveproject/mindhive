// Slugs for lists whose `slug` is unique (Task, Template, Study, ...).
//
// The slug comes from the title. When it is taken, the next free numbered
// form is used: one past the highest number already there, so a gap left by a
// deleted item ("foo-7" gone, "foo-10" present) never hands out a slug that
// exists. Existing slugs are read with sudo: a private item the caller cannot
// see still holds its slug.

const slugify = require("slugify");

const SLUGIFY_OPTIONS = {
  remove: /[*+~.()'"!:@]/g, // remove characters that match regex
  lower: true, // convert to lower case
  strict: true, // strip special characters except replacement
};

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function slugBase(title, fallback = "item") {
  return slugify(String(title || ""), SLUGIFY_OPTIONS) || fallback;
}

// `base`, or the first `base-N` that is not in `takenSlugs`.
function nextFreeSlug(base, takenSlugs) {
  const taken = new Set(takenSlugs || []);
  if (!taken.has(base)) return base;
  const numbered = new RegExp(`^${escapeRegExp(base)}-(\\d+)$`);
  let highest = 0;
  for (const slug of taken) {
    const match = numbered.exec(slug);
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  let n = highest + 1;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

// A free slug for a new item of `listKey` titled `title`.
async function uniqueSlug(context, listKey, title) {
  const base = slugBase(title, listKey.toLowerCase());
  const items = await context.sudo().query[listKey].findMany({
    where: { slug: { startsWith: base } },
    query: "slug",
  });
  return nextFreeSlug(
    base,
    items.map((item) => item.slug)
  );
}

module.exports = { slugBase, nextFreeSlug, uniqueSlug };
