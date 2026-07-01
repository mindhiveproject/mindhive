// Returns merged global + template-scoped milestones for a proposal board.
import slugify from "slugify";

function getTemplateBoardId(board: any): string | null {
  if (!board) return null;
  if (board.templateForClasses?.length) {
    return board.id;
  }
  return board.clonedFrom?.id || null;
}

function mergeMilestones(globalMs: any[], templateMs: any[]) {
  const byKey = new Map<string, any>();
  for (const m of globalMs) {
    if (m?.key) byKey.set(m.key, m);
  }
  for (const m of templateMs) {
    if (m?.key) byKey.set(m.key, m);
  }
  const merged = Array.from(byKey.values());
  const hasTemplate = templateMs.length > 0;
  if (hasTemplate) {
    merged.sort((a, b) => {
      const aTemplate = a.scope === "template";
      const bTemplate = b.scope === "template";
      if (aTemplate && bTemplate) {
        return (a.position ?? 0) - (b.position ?? 0);
      }
      if (aTemplate && !bTemplate) return -1;
      if (!aTemplate && bTemplate) return 1;
      return (a.key || "").localeCompare(b.key || "");
    });
  }
  return merged.filter((m) => m.isActive !== false);
}

const MILESTONE_RESOLVE_SCALAR_QUERY = `
  id
  key
  title
  description
  scope
  actionCardType
  reviewStage
  statusTarget
  legacyBoardStatusField
  legacyOpenForCommentsField
  logEventName
  position
  showInFeedbackCenter
  formDefinitionKeyPattern
  isActive
`;

const MILESTONE_QUERY = `
  ${MILESTONE_RESOLVE_SCALAR_QUERY.trim()}
  canReview { id name }
  formDefinition { id key }
  clonedFrom { id key title scope }
  actionCards { id publicId type title }
`;

async function resolveMilestonesForBoard(
  _root: unknown,
  { boardId }: { boardId: string },
  context: any
) {
  const board = await context.query.ProposalBoard.findOne({
    where: { id: boardId },
    query: "id clonedFrom { id } templateForClasses { id }",
  });
  if (!board) return [];

  const templateBoardId = getTemplateBoardId(board);

  const globalMs = await context.query.Milestone.findMany({
    where: {
      scope: { equals: "global" },
      isActive: { equals: true },
    },
    query: MILESTONE_RESOLVE_SCALAR_QUERY,
  });

  let templateMs: any[] = [];
  if (templateBoardId) {
    templateMs = await context.query.Milestone.findMany({
      where: {
        scope: { equals: "template" },
        templateBoard: { id: { equals: templateBoardId } },
        isActive: { equals: true },
      },
      query: MILESTONE_RESOLVE_SCALAR_QUERY,
      orderBy: [{ position: "asc" }],
    });
  }

  return mergeMilestones(globalMs, templateMs);
}

export default resolveMilestonesForBoard;

export async function assertTemplateBoardTeacher(
  context: any,
  templateBoardId: string
) {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in.");
  }

  const profile = await context.query.Profile.findOne({
    where: { id: session.itemId },
    query: "permissions { canManageUsers canManageForms }",
  });
  const isAdmin = (profile?.permissions || []).some(
    (p: any) => p.canManageUsers || p.canManageForms
  );
  if (isAdmin) return;

  const board = await context.query.ProposalBoard.findOne({
    where: { id: templateBoardId },
    query: "id templateForClasses { id creator { id } }",
  });
  if (!board) {
    throw new Error("Template board not found.");
  }

  const isCreator = (board.templateForClasses || []).some(
    (c: any) => c?.creator?.id === session.itemId
  );
  if (!isCreator) {
    throw new Error("Forbidden: you must be the class creator for this template.");
  }
}

export function slugifyMilestoneKey(title: string, fallback: string) {
  const base = slugify(title || fallback, {
    replacement: "_",
    lower: true,
    strict: true,
  });
  return base || fallback;
}

export { MILESTONE_QUERY, MILESTONE_RESOLVE_SCALAR_QUERY, mergeMilestones, getTemplateBoardId };
