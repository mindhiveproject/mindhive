/**
 * Helpers for matching template board cards to clone (student) board cards
 * when publicId is not available. Uses section index + card index (order by position)
 * so at most one clone card matches per board (avoids duplicate position values).
 */

function sortByPosition<T extends { position?: number | null }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export type TemplateCardWithSection = {
  id: string;
  section?: { id: string; position?: number | null } | null;
};

export type CloneBoardWithSections = {
  sections?: Array<{
    id: string;
    position?: number | null;
    cards?: Array<{ id: string; position?: number | null }>;
  }>;
};

/**
 * Returns the section index and card index of the template card on the template board
 * (sections and cards ordered by position). Returns null if template board or indices cannot be resolved.
 */
export async function getTemplateSectionAndCardIndices(
  context: any,
  templateBoardId: string,
  templateCard: TemplateCardWithSection
): Promise<{ sectionIndex: number; cardIndex: number } | null> {
  const templateBoard = await context.query.ProposalBoard.findOne({
    where: { id: templateBoardId },
    query: "id sections { id position cards { id position } }",
  });
  if (!templateBoard?.sections?.length) return null;

  const sections = sortByPosition(templateBoard.sections);
  const sectionIndex = sections.findIndex(
    (s: any) => s.id === templateCard.section?.id
  );
  if (sectionIndex < 0) return null;

  const section = sections[sectionIndex];
  const cards = sortByPosition((section as any).cards ?? []);
  const cardIndex = cards.findIndex((c: any) => c.id === templateCard.id);
  if (cardIndex < 0) return null;

  return { sectionIndex, cardIndex };
}

/**
 * Returns the clone card at the given section index and card index on the student board
 * (sections and cards ordered by position). Returns null if out of range.
 */
export function getCloneCardAtIndices(
  studentBoard: CloneBoardWithSections,
  sectionIndex: number,
  cardIndex: number
): { id: string } | null {
  const sections = sortByPosition(studentBoard.sections ?? []);
  const section = sections[sectionIndex];
  if (!section) return null;

  const cards = sortByPosition((section as any).cards ?? []);
  const card = cards[cardIndex];
  if (!card) return null;

  return { id: card.id };
}
