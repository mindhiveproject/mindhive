/**
 * Helpers for propagating template proposal board changes to all clone boards.
 * Used by applyTemplateBoardChanges mutation.
 */

import { isClassTemplateBoard } from "./classTemplateBoards";

export { isClassTemplateBoard };

const uniqid = require("uniqid") as () => string;

const TEMPLATE_QUERY = `
  id
  publicId
  templateForClasses { id }
  templatesForClass { id }
  clonedFrom { id }
  sections {
    id
    publicId
    title
    description
    position
    cards {
      id
      publicId
      title
      description
      type
      shareType
      position
      content
      settings
      milestone { id }
      resources { id }
      assignments { id }
      studies { id }
      tasks { id }
    }
  }
`;

const CLONE_BOARD_QUERY = `
  id
  sections {
    id
    publicId
    title
    position
    cards {
      id
      publicId
      title
      position
      section { id }
      settings
      resources { id }
      assignments { id }
      studies { id }
      tasks { id }
    }
  }
`;

export type TemplateBoard = {
  id: string;
  publicId?: string | null;
  templateForClasses?: Array<{ id: string }>;
  templatesForClass?: Array<{ id: string }>;
  clonedFrom?: { id: string } | null;
  sections: Array<{
    id: string;
    publicId?: string | null;
    title: string;
    description?: string | null;
    position: number | null;
    cards: Array<{
      id: string;
      publicId?: string | null;
      title: string;
      description?: string | null;
      type?: string | null;
      shareType?: string | null;
      position: number | null;
      content?: string | null;
      settings?: Record<string, unknown> | null;
      resources?: Array<{ id: string }>;
      assignments?: Array<{ id: string }>;
      studies?: Array<{ id: string }>;
      tasks?: Array<{ id: string }>;
    }>;
  }>;
};

export type CloneBoard = {
  id: string;
  sections: Array<{
    id: string;
    publicId?: string | null;
    title: string;
    position: number | null;
    cards: Array<{
      id: string;
      publicId?: string | null;
      title: string;
      position: number | null;
      section: { id: string };
      settings?: Record<string, unknown> | null;
      resources?: Array<{ id: string }>;
      assignments?: Array<{ id: string }>;
      studies?: Array<{ id: string }>;
      tasks?: Array<{ id: string }>;
    }>;
  }>;
};

function sortByPosition<T extends { position?: number | null }>(arr: T[]): T[] {
  return [...arr].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );
}

/**
 * Merge template card settings into clone card settings. All keys from template
 * are applied except `status`; the clone's `status` is always preserved.
 */
function mergeSettingsPreservingStatus(
  cloneSettings: Record<string, unknown> | null | undefined,
  templateSettings: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const clone =
    cloneSettings && typeof cloneSettings === "object" ? cloneSettings : {};
  const template =
    templateSettings && typeof templateSettings === "object"
      ? templateSettings
      : {};
  const { status: cloneStatus, ...cloneRest } = clone as {
    status?: unknown;
    [k: string]: unknown;
  };
  const { status: _templateStatus, ...templateRest } = template as {
    status?: unknown;
    [k: string]: unknown;
  };
  return {
    ...cloneRest,
    ...templateRest,
    ...(cloneStatus !== undefined ? { status: cloneStatus } : {}),
  };
}

/**
 * Fetch the template board and all clone boards (boards that have clonedFrom = boardId).
 */
export async function getTemplateAndClones(
  context: any,
  templateBoardId: string
): Promise<{ template: TemplateBoard | null; clones: CloneBoard[] }> {
  const template = await context.query.ProposalBoard.findOne({
    where: { id: templateBoardId },
    query: TEMPLATE_QUERY,
  });
  if (!template) {
    return { template: null, clones: [] };
  }

  const templateSections = (template.sections ?? []).map((s: any) => ({
    ...s,
    cards: sortByPosition(s.cards ?? []),
  }));
  const normalizedTemplate = {
    ...template,
    sections: sortByPosition(templateSections),
  };

  const clones = await context.query.ProposalBoard.findMany({
    where: { clonedFrom: { id: { equals: templateBoardId } } },
    query: CLONE_BOARD_QUERY,
  });

  const normalizedClones = (clones ?? []).map((c: any) => ({
    ...c,
    sections: sortByPosition(
      (c.sections ?? []).map((s: any) => ({
        ...s,
        cards: sortByPosition(s.cards ?? []),
      }))
    ),
  }));

  return { template: normalizedTemplate, clones: normalizedClones };
}

/**
 * Match a template section to its clone by publicId. Positional matching is
 * unsafe: reordering or deleting a middle section causes every subsequent
 * clone section to be overwritten with the wrong template's title/description
 * and the trailing clone section (which may hold real student work) to be
 * deleted.
 *
 * Falls back to positional match ONLY when both sides lack a publicId AND the
 * two lists have identical length (no structural change possible). Otherwise
 * returns null, forcing the caller to create a new section rather than
 * blindly overwrite one that might belong to a different template section.
 */
function findCloneSection(
  templateSection: TemplateBoard["sections"][0],
  cloneSections: CloneBoard["sections"],
  templateIndex: number,
  templateSectionCount: number
): CloneBoard["sections"][0] | null {
  if (templateSection.publicId) {
    const byPublicId = cloneSections.find(
      (s) => s.publicId && s.publicId === templateSection.publicId
    );
    if (byPublicId) return byPublicId;
    // Template has a publicId but no clone matches — genuinely new section.
    return null;
  }
  // Legacy rows without publicIds: only trust position when neither side has
  // any publicIds AND lengths match (no reorder/delete possible).
  const anyCloneHasPublicId = cloneSections.some((s) => !!s.publicId);
  if (
    !anyCloneHasPublicId &&
    cloneSections.length === templateSectionCount
  ) {
    return cloneSections[templateIndex] ?? null;
  }
  return null;
}

/**
 * Match a template card to its clone by publicId. Same safety rules as
 * findCloneSection: positional fallback only when both sides are publicId-less
 * AND lengths match exactly.
 */
function findCloneCard(
  templateCard: TemplateBoard["sections"][0]["cards"][0],
  cloneCards: CloneBoard["sections"][0]["cards"],
  templateIndex: number,
  templateCardCount: number
): CloneBoard["sections"][0]["cards"][0] | null {
  if (templateCard.publicId) {
    const byPublicId = cloneCards.find(
      (c) => c.publicId && c.publicId === templateCard.publicId
    );
    if (byPublicId) return byPublicId;
    return null;
  }
  const anyCloneHasPublicId = cloneCards.some((c) => !!c.publicId);
  if (!anyCloneHasPublicId && cloneCards.length === templateCardCount) {
    return cloneCards[templateIndex] ?? null;
  }
  return null;
}

/**
 * Sync sections from template to one clone board: add missing, remove extra, update order and title/description.
 */
export async function syncSectionsToClone(
  context: any,
  template: TemplateBoard,
  clone: CloneBoard
): Promise<Map<string, string>> {
  const templateSectionIdsToCloneSectionIds = new Map<string, string>();
  const templateSections = template.sections ?? [];
  const cloneSections = clone.sections ?? [];

  for (let i = 0; i < templateSections.length; i++) {
    const ts = templateSections[i];
    const existing = findCloneSection(
      ts,
      cloneSections,
      i,
      templateSections.length
    );
    let cloneSectionId: string;
    if (existing) {
      cloneSectionId = existing.id;
      await context.db.ProposalSection.updateOne({
        where: { id: existing.id },
        data: {
          title: ts.title,
          description: ts.description ?? undefined,
          position: ts.position ?? i * 16384,
          ...(ts.publicId ? { publicId: ts.publicId } : {}),
        },
      });
    } else {
      const created = await context.db.ProposalSection.createOne({
        data: {
          board: { connect: { id: clone.id } },
          title: ts.title,
          description: ts.description ?? undefined,
          position: ts.position ?? i * 16384,
          ...(ts.publicId ? { publicId: ts.publicId } : {}),
        },
        query: "id",
      });
      cloneSectionId = created.id;
    }
    templateSectionIdsToCloneSectionIds.set(ts.id, cloneSectionId);
  }

  // Only delete clone sections whose publicId proves they descend from a
  // template section that is no longer present. A clone section with NO
  // publicId is of unknown provenance — leave it alone rather than risk
  // destroying student work. This trades some cleanup slack for safety.
  const keptCloneSectionIds = new Set(
    templateSectionIdsToCloneSectionIds.values()
  );
  const templatePublicIds = new Set(
    templateSections.map((s) => s.publicId).filter(Boolean) as string[]
  );
  const cloneSectionsToDelete = cloneSections.filter((s) => {
    if (keptCloneSectionIds.has(s.id)) return false;
    // Kept by ID match — safe to delete only if the clone has a publicId AND
    // that publicId is not in the current template (i.e., template removed it).
    return !!s.publicId && !templatePublicIds.has(s.publicId);
  });

  for (const section of cloneSectionsToDelete) {
    const cardIds = (section as any).cards?.map((c: any) => c.id) ?? [];
    for (const cardId of cardIds) {
      await context.db.ProposalCard.deleteOne({ where: { id: cardId } });
    }
    await context.db.ProposalSection.deleteOne({ where: { id: section.id } });
  }

  return templateSectionIdsToCloneSectionIds;
}

/**
 * Options for syncCardsToClone: when provided, template card ids in
 * cardIdsWithContentUpdate cause clone card content to be overwritten with
 * the template placeholder (teacher updated the content field).
 */
export type SyncCardsOptions = {
  cardIdsWithContentUpdate?: string[];
};

/**
 * Sync cards in one clone board to match template, using section id mapping.
 * Creates/updates/deletes cards and syncs template-owned fields and linked items.
 * When updating an existing clone card: preserves student-owned fields (content
 * unless in cardIdsWithContentUpdate; settings.status). Template card settings
 * (all keys except status) are merged into clone card settings.
 *
 * Student-owned fields never synced for existing clones:
 * content (unless in cardIdsWithContentUpdate), settings.status, internalContent,
 * revisedContent, comment, assignedTo.
 */
export async function syncCardsToClone(
  context: any,
  template: TemplateBoard,
  clone: CloneBoard,
  templateSectionIdToCloneSectionId: Map<string, string>,
  options?: SyncCardsOptions
): Promise<void> {
  const contentUpdateSet = new Set(options?.cardIdsWithContentUpdate ?? []);
  const templateSections = template.sections ?? [];

  for (let si = 0; si < templateSections.length; si++) {
    const tSection = templateSections[si];
    const cloneSectionId = templateSectionIdToCloneSectionId.get(tSection.id);
    if (!cloneSectionId) continue;

    const templateCards = tSection.cards ?? [];
    const cloneSection = clone.sections?.find((s) => s.id === cloneSectionId);
    const cloneCards = cloneSection
      ? (cloneSection as any).cards ?? []
      : [];

    const matchedCloneCardIds = new Set<string>();
    for (let ci = 0; ci < templateCards.length; ci++) {
      const tc = templateCards[ci];
      const existing = findCloneCard(tc, cloneCards, ci, templateCards.length);
      if (existing) matchedCloneCardIds.add(existing.id);
      const position = tc.position ?? ci * 16384;
      const settings =
        tc.settings && typeof tc.settings === "object"
          ? { ...tc.settings, status: "Not started" }
          : { status: "Not started" };

      if (existing) {
        // Update template-owned fields; preserve student content unless in
        // cardIdsWithContentUpdate. Merge settings from template into clone,
        // preserving the clone's status.
        const overwriteContent = contentUpdateSet.has(tc.id);
        const mergedSettings = mergeSettingsPreservingStatus(
          (existing as { settings?: Record<string, unknown> | null }).settings,
          tc.settings
        );
        await context.db.ProposalCard.updateOne({
          where: { id: existing.id },
          data: {
            title: tc.title,
            description: tc.description ?? undefined,
            type: tc.type ?? undefined,
            shareType: tc.shareType ?? undefined,
            position,
            ...(overwriteContent ? { content: tc.content ?? undefined } : {}),
            // Drop any collaborative Yjs state so the next time this clone card is
            // opened in the collaborative editor it re-seeds (browser-side) from
            // the freshly propagated HTML. Without this, a stale yjsState blob
            // would mask the propagated text. See keystone/collab-server.js.
            yjsState: null,
            publicId: tc.publicId ?? uniqid(),
            settings: mergedSettings,
            resources: { set: (tc.resources ?? []).map((r) => ({ id: r.id })) },
            assignments: { set: (tc.assignments ?? []).map((a) => ({ id: a.id })) },
            studies: { set: (tc.studies ?? []).map((s) => ({ id: s.id })) },
            tasks: { set: (tc.tasks ?? []).map((t) => ({ id: t.id })) },
            ...((tc as any).milestone?.id
              ? { milestone: { connect: { id: (tc as any).milestone.id } } }
              : {}),
          },
        });
      } else {
        await context.db.ProposalCard.createOne({
          data: {
            section: { connect: { id: cloneSectionId } },
            publicId: tc.publicId ?? uniqid(),
            title: tc.title,
            description: tc.description ?? undefined,
            type: tc.type ?? undefined,
            shareType: tc.shareType ?? undefined,
            position,
            content: tc.content ?? undefined,
            settings,
            ...((tc as any).milestone?.id
              ? { milestone: { connect: { id: (tc as any).milestone.id } } }
              : {}),
            resources: {
              connect: (tc.resources ?? []).map((r) => ({ id: r.id })),
            },
            assignments: {
              connect: (tc.assignments ?? []).map((a) => ({ id: a.id })),
            },
            studies: {
              connect: (tc.studies ?? []).map((s) => ({ id: s.id })),
            },
            tasks: {
              connect: (tc.tasks ?? []).map((t) => ({ id: t.id })),
            },
          },
          query: "id",
        });
      }
    }

    // Only delete clone cards whose publicId proves they descend from a
    // template card that has since been removed. Cards matched by findCloneCard
    // are always kept (matchedCloneCardIds). Cards with no publicId are of
    // unknown provenance — leave them alone. Previously this filter deleted
    // by index-tail, which silently destroyed real student work whenever a
    // teacher reordered or removed a middle template card.
    const templatePublicIds = new Set(
      templateCards.map((c) => c.publicId).filter(Boolean) as string[]
    );
    const cloneCardsToDelete = cloneCards.filter((c: any) => {
      if (matchedCloneCardIds.has(c.id)) return false;
      return !!c.publicId && !templatePublicIds.has(c.publicId);
    });
    for (const c of cloneCardsToDelete) {
      await context.db.ProposalCard.deleteOne({ where: { id: c.id } });
    }
  }
}

/**
 * Options for applyTemplateToClones: cardIdsWithContentUpdate = template card ids
 * for which the teacher updated the content field; those clone cards get the new placeholder.
 */
export type ApplyTemplateOptions = {
  cardIdsWithContentUpdate?: string[];
};

/**
 * Full sync: sections then cards (with linked items) for all clones.
 */
export async function applyTemplateToClones(
  context: any,
  templateBoardId: string,
  options?: ApplyTemplateOptions
): Promise<{ updatedCloneCount: number; errors: string[] }> {
  const { template, clones } = await getTemplateAndClones(
    context,
    templateBoardId
  );
  const errors: string[] = [];
  if (!template) {
    errors.push("Template board not found.");
    return { updatedCloneCount: 0, errors };
  }
  if (clones.length === 0) {
    return { updatedCloneCount: 0, errors };
  }

  const syncOptions: SyncCardsOptions = {
    cardIdsWithContentUpdate: options?.cardIdsWithContentUpdate,
  };

  for (const clone of clones) {
    try {
      const sectionIdMap = await syncSectionsToClone(context, template, clone);
      await syncCardsToClone(
        context,
        template,
        clone,
        sectionIdMap,
        syncOptions
      );
    } catch (e: any) {
      errors.push(`Clone ${clone.id}: ${e?.message ?? String(e)}`);
    }
  }

  return {
    updatedCloneCount: clones.length - errors.length,
    errors,
  };
}
