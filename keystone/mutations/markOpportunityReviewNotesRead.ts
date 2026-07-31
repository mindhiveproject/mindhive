/**
 * Connect the current session user to OpportunityReviewNote.readBy for the
 * given note ids.
 *
 * Visibility is enforced via a non-sudo query first. The write uses Prisma
 * directly because list resolveInput strips readBy from Keystone updates
 * (author-only GraphQL update must not accept client-supplied readBy).
 *
 * Returns via context.db (not context.query): Keystone 6's DateTime scalar
 * rejects pre-serialized ISO strings from context.query — same pattern as
 * publishFormDefinition / duplicateFormDefinition.
 */
async function markOpportunityReviewNotesRead(
  _root: unknown,
  { noteIds }: { noteIds: string[] },
  context: any
): Promise<any[]> {
  const sessionId = context.session?.itemId;
  if (!sessionId) {
    throw new Error("You must be signed in to mark review notes as read.");
  }

  const uniqueIds = [
    ...new Set(
      (Array.isArray(noteIds) ? noteIds : [])
        .map((id) => (id == null ? "" : String(id)))
        .filter(Boolean)
    ),
  ];
  if (uniqueIds.length === 0) {
    return [];
  }

  // Access filter applies: only notes the user can see are returned.
  const visible = await context.query.OpportunityReviewNote.findMany({
    where: { id: { in: uniqueIds } },
    query: `
      id
      readBy { id }
    `,
  });

  const updated: any[] = [];

  for (const note of visible) {
    const alreadyRead = (note.readBy || []).some(
      (reader: { id?: string }) => reader?.id === sessionId
    );
    if (!alreadyRead) {
      // Bypass Keystone resolveInput which strips readBy on update.
      await context.prisma.opportunityReviewNote.update({
        where: { id: note.id },
        data: {
          readBy: { connect: { id: sessionId } },
        },
      });
    }

    const current = await context.db.OpportunityReviewNote.findOne({
      where: { id: note.id },
    });
    if (current) updated.push(current);
  }

  return updated;
}

export default markOpportunityReviewNotesRead;
