/**
 * Helpers for propagating template proposal board changes to all clone boards.
 * Used by applyTemplateBoardChanges mutation.
 */

import { isClassTemplateBoard } from "./classTemplateBoards";
// Pure matcher lives in .js so scenarios can run with plain Node.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  hasPublicId,
  planRowMatches,
} = require("./boardPropagationMatch") as {
  hasPublicId: (value: string | null | undefined) => value is string;
  planRowMatches: <
    T extends { id: string; publicId?: string | null; position?: number | null },
    C extends { id: string; publicId?: string | null; position?: number | null }
  >(
    templateRows: T[],
    cloneRows: C[]
  ) => Array<{
    template: T;
    decision:
      | { action: "update"; clone: C; needsSharedPublicId: boolean }
      | { action: "create" }
      | { action: "skip" };
  }>;
};

export { isClassTemplateBoard };
export { hasPublicId, planRowMatches };

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
 * Ensure a shared publicId exists on a template row (and in-memory object).
 * Generates once when missing; writes to the template DB row so later clones
 * in the same applyTemplateToClones loop see the same id.
 */
async function ensureTemplatePublicId(
  context: any,
  listKey: "ProposalSection" | "ProposalCard",
  row: { id: string; publicId?: string | null }
): Promise<string> {
  if (hasPublicId(row.publicId)) {
    return row.publicId;
  }
  const publicId = uniqid();
  await context.db[listKey].updateOne({
    where: { id: row.id },
    data: { publicId },
  });
  row.publicId = publicId;
  return publicId;
}

/**
 * Sync sections from template to one clone board: add missing, remove extra, update order and title/description.
 *
 * Matching is claimed-set aware (see boardPropagationMatch.ts): publicId rows
 * match by identity; publicId-less leftovers pair with publicId-less clones;
 * create only when a template row has a publicId and no clone match.
 */
export async function syncSectionsToClone(
  context: any,
  template: TemplateBoard,
  clone: CloneBoard
): Promise<Map<string, string>> {
  const templateSectionIdsToCloneSectionIds = new Map<string, string>();
  const templateSections = template.sections ?? [];
  const cloneSections = clone.sections ?? [];
  const plans = planRowMatches(templateSections, cloneSections);

  for (let i = 0; i < plans.length; i++) {
    const { template: ts, decision } = plans[i];
    const position = ts.position ?? i * 16384;

    if (decision.action === "skip") {
      continue;
    }

    if (decision.action === "update") {
      const existing = decision.clone;
      let publicId = hasPublicId(ts.publicId) ? ts.publicId : undefined;
      if (decision.needsSharedPublicId || !publicId) {
        publicId = await ensureTemplatePublicId(
          context,
          "ProposalSection",
          ts
        );
      }
      await context.db.ProposalSection.updateOne({
        where: { id: existing.id },
        data: {
          title: ts.title,
          description: ts.description ?? undefined,
          position,
          publicId,
        },
      });
      // Keep in-memory clone row aligned for card sync within this pass.
      existing.publicId = publicId;
      templateSectionIdsToCloneSectionIds.set(ts.id, existing.id);
      continue;
    }

    // create — only reached for template rows that already have a publicId
    const publicId = hasPublicId(ts.publicId)
      ? ts.publicId
      : await ensureTemplatePublicId(context, "ProposalSection", ts);
    const created = await context.db.ProposalSection.createOne({
      data: {
        board: { connect: { id: clone.id } },
        title: ts.title,
        description: ts.description ?? undefined,
        position,
        publicId,
      },
      query: "id",
    });
    templateSectionIdsToCloneSectionIds.set(ts.id, created.id);
  }

  // Only delete clone sections whose publicId proves they descend from a
  // template section that is no longer present. A clone section with NO
  // publicId is of unknown provenance — leave it alone rather than risk
  // destroying student work. This trades some cleanup slack for safety.
  const keptCloneSectionIds = new Set(
    templateSectionIdsToCloneSectionIds.values()
  );
  const templatePublicIds = new Set(
    templateSections
      .map((s) => s.publicId)
      .filter((id): id is string => hasPublicId(id))
  );
  const cloneSectionsToDelete = cloneSections.filter((s) => {
    if (keptCloneSectionIds.has(s.id)) return false;
    return hasPublicId(s.publicId) && !templatePublicIds.has(s.publicId);
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
 * Matching uses the same claimed leftover pairing as sections (see
 * boardPropagationMatch.ts). Shared publicIds are stamped on both sides when
 * a publicId-less template card is paired with a leftover clone card.
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

    const plans = planRowMatches(templateCards, cloneCards);
    const matchedCloneCardIds = new Set<string>();

    for (let ci = 0; ci < plans.length; ci++) {
      const { template: tc, decision } = plans[ci];
      const position = tc.position ?? ci * 16384;
      const settings =
        tc.settings && typeof tc.settings === "object"
          ? { ...tc.settings, status: "Not started" }
          : { status: "Not started" };

      if (decision.action === "skip") {
        continue;
      }

      if (decision.action === "update") {
        const existing = decision.clone;
        matchedCloneCardIds.add(existing.id);

        let publicId = hasPublicId(tc.publicId) ? tc.publicId : undefined;
        if (decision.needsSharedPublicId || !publicId) {
          publicId = await ensureTemplatePublicId(
            context,
            "ProposalCard",
            tc
          );
        }

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
            publicId,
            settings: mergedSettings,
            resources: { set: (tc.resources ?? []).map((r) => ({ id: r.id })) },
            assignments: {
              set: (tc.assignments ?? []).map((a) => ({ id: a.id })),
            },
            studies: { set: (tc.studies ?? []).map((s) => ({ id: s.id })) },
            tasks: { set: (tc.tasks ?? []).map((t) => ({ id: t.id })) },
            ...((tc as any).milestone?.id
              ? { milestone: { connect: { id: (tc as any).milestone.id } } }
              : {}),
          },
        });
        continue;
      }

      // create — template row has (or receives) a publicId and no clone match
      const publicId = hasPublicId(tc.publicId)
        ? tc.publicId
        : await ensureTemplatePublicId(context, "ProposalCard", tc);
      await context.db.ProposalCard.createOne({
        data: {
          section: { connect: { id: cloneSectionId } },
          publicId,
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

    // Only delete clone cards whose publicId proves they descend from a
    // template card that has since been removed. Cards matched above are
    // always kept. Cards with no publicId are of unknown provenance — leave
    // them alone.
    const templatePublicIds = new Set(
      templateCards
        .map((c) => c.publicId)
        .filter((id): id is string => hasPublicId(id))
    );
    const cloneCardsToDelete = cloneCards.filter((c: any) => {
      if (matchedCloneCardIds.has(c.id)) return false;
      return hasPublicId(c.publicId) && !templatePublicIds.has(c.publicId);
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
