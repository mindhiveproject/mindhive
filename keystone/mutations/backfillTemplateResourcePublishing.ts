import { permissions } from "../access";
import { publishResourcesToTemplateClasses } from "./utils/classTemplateBoards";

type BackfillArgs = {
  dryRun?: boolean;
};

const BOARD_PAGE_SIZE = 200;

/**
 * Publishes resources linked on class template cards to the classes using
 * that template (Resource.classes + settings.publishedToClassIds) — what a
 * new link now does automatically (ProposalCard hook, setResourceTemplateCards).
 * Resources linked before that stay hidden from students until published.
 *
 * Note: this also re-publishes linked resources a teacher unpublished on
 * purpose; run the dryRun first. Idempotent; returns how many resources were
 * (or, with dryRun, would be) published to at least one more class.
 */
export default async function backfillTemplateResourcePublishing(
  _root: unknown,
  args: BackfillArgs,
  context: any
): Promise<number> {
  if (!context.session?.itemId) {
    throw new Error("You must be signed in to backfill resource publishing.");
  }
  if (!permissions.canManageUsers({ session: context.session })) {
    throw new Error("Forbidden: you need user-management permission.");
  }

  const dryRun = args?.dryRun ?? false;
  const sudo = context.sudo();
  const updatedResourceIds = new Set<string>();

  for (let skip = 0; ; skip += BOARD_PAGE_SIZE) {
    const boards = await sudo.query.ProposalBoard.findMany({
      where: {
        isTemplate: { equals: false },
        OR: [
          { templatesForClass: { some: {} } },
          { templateForClasses: { some: {} } },
        ],
      },
      orderBy: [{ id: "asc" }],
      take: BOARD_PAGE_SIZE,
      skip,
      query: `
        id
        templateForClasses { id }
        templatesForClass { id }
        sections {
          cards {
            resources { id settings }
          }
        }
      `,
    });

    for (const board of boards || []) {
      const classIds = [
        ...(board.templateForClasses || []),
        ...(board.templatesForClass || []),
      ].map((c: { id: string }) => c.id);

      const unpublishedIds = new Set<string>();
      for (const section of board.sections || []) {
        for (const card of section.cards || []) {
          for (const resource of card.resources || []) {
            if (!resource?.id) continue;
            const published = Array.isArray(
              resource.settings?.publishedToClassIds
            )
              ? resource.settings.publishedToClassIds
              : [];
            if (classIds.some((id) => !published.includes(id))) {
              unpublishedIds.add(resource.id);
            }
          }
        }
      }
      if (unpublishedIds.size === 0) continue;

      if (!dryRun) {
        // session: null — this mutation already required admin rights.
        await publishResourcesToTemplateClasses(
          sudo,
          board.id,
          [...unpublishedIds],
          null
        );
      }
      unpublishedIds.forEach((id) => updatedResourceIds.add(id));
    }

    if ((boards || []).length < BOARD_PAGE_SIZE) break;
  }

  return updatedResourceIds.size;
}
