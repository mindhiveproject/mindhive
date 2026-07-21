// Shared card/field visibility rules for DefinitionForm rendering and
// validation. Keeps CardRenderer and submit-time validation in sync.

export function rolesIntersect(allowed, viewerRoles) {
  if (!Array.isArray(allowed) || allowed.length === 0) return true;
  if (!Array.isArray(viewerRoles) || viewerRoles.length === 0) return false;
  return allowed.some((r) => viewerRoles.includes(r));
}

export function statusMatches(allowed, entityStatus) {
  if (!Array.isArray(allowed) || allowed.length === 0) return true;
  return allowed.includes(entityStatus);
}

export function isCardVisible(card, { viewerRoles, entityStatus }) {
  if (!rolesIntersect(card.roleVisibility, viewerRoles)) return false;
  if (!statusMatches(card.visibleWhenStatus, entityStatus)) return false;
  return true;
}

/** Fields the current viewer can see and edit, deduped by field.name. */
export function getVisibleFields(definition, { viewerRoles, entityStatus }) {
  if (!definition?.cards) return [];
  const byName = new Map();
  for (const card of definition.cards) {
    if (card.cardType !== "fields") continue;
    if (!isCardVisible(card, { viewerRoles, entityStatus })) continue;
    const fields = (card.fields || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .filter((f) => rolesIntersect(f.visibilityRoles, viewerRoles));
    for (const f of fields) {
      if (!f?.name) continue;
      if (f.fieldType === "read_only_html") continue;
      byName.set(f.name, f);
    }
  }
  return Array.from(byName.values());
}
