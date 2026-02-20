/**
 * Helpers for propagating template proposal board changes to all clone boards.
 * Used by applyTemplateBoardChanges mutation.
 */

const TEMPLATE_QUERY = `
  id
  publicId
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
 * Find clone section matching template section by position index.
 * Uses index only (publicId is often undefined); template and clone are ordered by position.
 */
function findCloneSection(
  _templateSection: TemplateBoard["sections"][0],
  cloneSections: CloneBoard["sections"],
  templateIndex: number
): CloneBoard["sections"][0] | null {
  return cloneSections[templateIndex] ?? null;
}

/**
 * Find clone card matching template card by position index within the section.
 * Uses index only (publicId is often undefined); sections are ordered by position.
 */
function findCloneCard(
  _templateCard: TemplateBoard["sections"][0]["cards"][0],
  cloneCards: CloneBoard["sections"][0]["cards"],
  templateIndex: number
): CloneBoard["sections"][0]["cards"][0] | null {
  return cloneCards[templateIndex] ?? null;
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
    const existing = findCloneSection(ts, cloneSections, i);
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

  const keptCloneSectionIds = new Set(
    templateSectionIdsToCloneSectionIds.values()
  );
  const cloneSectionsToDelete = cloneSections.filter(
    (s) => !keptCloneSectionIds.has(s.id)
  );

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
 * When updating an existing clone card: preserves student-owned fields (content,
 * settings) unless the template card id is in options.cardIdsWithContentUpdate,
 * in which case the template's content (new placeholder) is written to the clone.
 *
 * Student-owned fields never synced for existing clones (do not add to query/update):
 * content (unless in cardIdsWithContentUpdate), settings, internalContent,
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

    for (let ci = 0; ci < templateCards.length; ci++) {
      const tc = templateCards[ci];
      const existing = findCloneCard(tc, cloneCards, ci);
      const position = tc.position ?? ci * 16384;
      const settings =
        tc.settings && typeof tc.settings === "object"
          ? { ...tc.settings, status: "Not started" }
          : { status: "Not started" };

      if (existing) {
        // Update template-owned fields; preserve student content/settings unless
        // this template card is in cardIdsWithContentUpdate (teacher changed content).
        const overwriteContent = contentUpdateSet.has(tc.id);
        await context.db.ProposalCard.updateOne({
          where: { id: existing.id },
          data: {
            title: tc.title,
            description: tc.description ?? undefined,
            type: tc.type ?? undefined,
            shareType: tc.shareType ?? undefined,
            position,
            ...(overwriteContent ? { content: tc.content ?? undefined } : {}),
            ...(tc.publicId ? { publicId: tc.publicId } : {}),
            resources: tc.resources?.length
              ? { set: tc.resources.map((r) => ({ id: r.id })) }
              : undefined,
            assignments: tc.assignments?.length
              ? { set: tc.assignments.map((a) => ({ id: a.id })) }
              : undefined,
            studies: tc.studies?.length
              ? { set: tc.studies.map((s) => ({ id: s.id })) }
              : undefined,
            tasks: tc.tasks?.length
              ? { set: tc.tasks.map((t) => ({ id: t.id })) }
              : undefined,
          },
        });
      } else {
        await context.db.ProposalCard.createOne({
          data: {
            section: { connect: { id: cloneSectionId } },
            ...(tc.publicId ? { publicId: tc.publicId } : {}),
            title: tc.title,
            description: tc.description ?? undefined,
            type: tc.type ?? undefined,
            shareType: tc.shareType ?? undefined,
            position,
            content: tc.content ?? undefined,
            settings,
            resources:
              tc.resources?.length > 0
                ? { connect: tc.resources.map((r) => ({ id: r.id })) }
                : undefined,
            assignments:
              tc.assignments?.length > 0
                ? { connect: tc.assignments.map((a) => ({ id: a.id })) }
                : undefined,
            studies:
              tc.studies?.length > 0
                ? { connect: tc.studies.map((s) => ({ id: s.id })) }
                : undefined,
            tasks:
              tc.tasks?.length > 0
                ? { connect: tc.tasks.map((t) => ({ id: t.id })) }
                : undefined,
          },
          query: "id",
        });
      }
    }

    const templateCardCount = templateCards.length;
    const cloneCardsToDelete = cloneCards.filter(
      (_: any, idx: number) => idx >= templateCardCount
    );
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
