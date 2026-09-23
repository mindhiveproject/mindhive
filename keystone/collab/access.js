// Per-document access rules for the collaboration socket (see ../collab-server.js).
//
// This is the socket's equivalent of ../access.ts: Yjs updates never pass
// through Keystone — the collab server writes `yjsState` straight through
// Prisma — so the list access rules in ../schemas/ do NOT guard this
// connection. Whatever should be read-only here has to be decided in this file.
//
// Plain CommonJS + JSDoc rather than TypeScript, because the collab server runs
// with a bare `node collab-server.js` (no build step).

/**
 * @typedef {"write" | "read" | "none"} DocumentAccess
 *   "write" – may edit, "read" – may open and follow along but edits are
 *   ignored, "none" – connection refused.
 *
 * @typedef {(
 *   prisma: import("@prisma/client").PrismaClient,
 *   itemId: string,
 *   profileId: string | null,
 * ) => Promise<DocumentAccess>} DocumentRule
 */

/** @type {DocumentRule} */
async function visual(prisma, itemId, profileId) {
  const item = await prisma.visual.findUnique({
    where: { id: itemId },
    select: { authorId: true, privacy: true },
  });
  if (!item) return "none";

  // A private visual isn't a non-editor's to open at all; anything else they
  // may watch without contributing to it.
  const nonEditor = item.privacy === "private" ? "none" : "read";

  if (!profileId) return nonEditor;
  if (item.authorId === profileId) return "write";

  const invited = await prisma.profile.findFirst({
    where: {
      id: profileId,
      OR: [
        { collaboratorInVisual: { some: { id: itemId } } },
        { permissions: { some: { canAccessAdminUI: true } } },
        // Invited as a Viewer. Without this a Viewer on a *private* visual
        // would be refused the connection outright by `nonEditor` above, even
        // though the whole point of the role is that they may open it.
        { viewerInVisual: { some: { id: itemId } } },
      ],
    },
    select: {
      id: true,
      collaboratorInVisual: { where: { id: itemId }, select: { id: true } },
      permissions: { where: { canAccessAdminUI: true }, select: { id: true } },
    },
  });

  if (!invited) return nonEditor;
  const mayWrite =
    invited.collaboratorInVisual.length > 0 || invited.permissions.length > 0;
  return mayWrite ? "write" : "read";
}

// Keyed by Prisma model name, i.e. the part before ":" in the document name.
/** @type {Record<string, DocumentRule>} */
const rules = {
  visual,
};

/**
 * Resolves what `profileId` may do with a collaborative document. Models with
 * no rule above keep the original behaviour: any signed-in user may edit any
 * existing document.
 *
 * @param {import("@prisma/client").PrismaClient} prisma
 * @param {string} modelName
 * @param {string} itemId
 * @param {string | null} profileId
 * @returns {Promise<DocumentAccess>}
 */
async function documentAccess(prisma, modelName, itemId, profileId) {
  const rule = rules[modelName];
  if (rule) return rule(prisma, itemId, profileId);

  const item = await prisma[modelName].findUnique({
    where: { id: itemId },
    select: { id: true },
  });
  if (!item) return "none";
  // Anonymous read is opt-in per model — don't hand it to lists nobody has
  // reviewed for it. Visuals get it through the rule above.
  return profileId ? "write" : "none";
}

module.exports = { documentAccess };
