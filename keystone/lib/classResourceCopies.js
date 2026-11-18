// Pure rules for the resources a board copy duplicates when it is made into a
// class template (copyProposalBoard), and for who may edit such a class copy
// (schemas/Resource.ts). Kept free of Keystone so they can be unit tested
// with node:test.

/**
 * Whether a board copy duplicates the source's resources instead of linking
 * the same rows. Only a copy made into a class template (classIdTemplate)
 * does: the class then owns its resources, and its staff control their
 * content and publication without touching the source (often a public
 * template shared by every class). Student/working copies keep linking their
 * class template's resources.
 */
function shouldCopyResources({ classIdTemplate }) {
  return Boolean(classIdTemplate);
}

/**
 * Unique resources linked on a board, each with the ids of the copied cards
 * that link it and whether the board itself links it.
 * `sections[].cards[]` must carry `resources[]` (source ids) and `newId` (the
 * copied card's id). `boardResources` are the source board's own links.
 */
function collectResourceLinks(sections, boardResources) {
  const byId = new Map();
  const entryFor = (id) => {
    const entry = byId.get(id) || { sourceId: id, cardIds: [], onBoard: false };
    byId.set(id, entry);
    return entry;
  };
  for (const resource of boardResources || []) {
    if (resource?.id) entryFor(String(resource.id)).onBoard = true;
  }
  for (const section of sections || []) {
    for (const card of section?.cards || []) {
      if (!card?.newId) continue;
      for (const resource of card?.resources || []) {
        if (!resource?.id) continue;
        const entry = entryFor(String(resource.id));
        if (!entry.cardIds.includes(String(card.newId))) {
          entry.cardIds.push(String(card.newId));
        }
      }
    }
  }
  return [...byId.values()];
}

/**
 * Settings for a class copy of a resource: the source's settings, published
 * to the new class only (the source's publications belong to other classes).
 * Published by default, as linking a resource on a class template card
 * publishes it (publishResourcesToTemplateClasses); staff can unpublish.
 */
function classCopySettings(settings, classId) {
  let base = settings;
  if (typeof base === "string") {
    try {
      base = JSON.parse(base);
    } catch {
      base = {};
    }
  }
  if (!base || typeof base !== "object" || Array.isArray(base)) base = {};
  return { ...base, publishedToClassIds: classId ? [String(classId)] : [] };
}

/**
 * Whether class staff may edit a resource's content: it is a custom copy
 * (isCustom) linked to at least one class they staff (creator, co-teacher,
 * mentor). Shared originals, such as public template resources linked to a
 * class, stay editable by their author and collaborators only.
 */
function staffCanEditClassResource(resource, staffClassIds) {
  if (!resource?.isCustom) return false;
  const staff = new Set((staffClassIds || []).map(String));
  if (staff.size === 0) return false;
  return (resource.classes || []).some((c) => c?.id && staff.has(String(c.id)));
}

module.exports = {
  shouldCopyResources,
  collectResourceLinks,
  classCopySettings,
  staffCanEditClassResource,
};
