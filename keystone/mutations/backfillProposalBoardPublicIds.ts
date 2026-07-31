// One-shot: stamp `publicId` on ProposalSection and ProposalCard rows so the
// template↔clone matcher in utils/boardPropagation.ts can pair them by
// identity instead of by position.
//
// Runs in three passes per template:
//   1. Ensure every template section/card has a `publicId` (generate one if
//      missing).
//   2. For each clone board (a ProposalBoard whose `clonedFrom` points at the
//      template), align sections and cards positionally AT THIS SNAPSHOT and
//      copy the template's publicId onto the clone side when the clone lacks
//      one. Positional alignment is only safe because we run this BEFORE the
//      new propagation code deploys — nothing has been reordered since the
//      clone was made.
//   3. If a template section/card has a publicId AND the aligned clone has a
//      DIFFERENT publicId, log it and skip — this is a data-inconsistency
//      case that shouldn't be auto-resolved. Same for length mismatches.
//
// Admin-only. Dry-run by default so you can preview the plan; pass
// dryRun:false to apply.

type BackfillArgs = {
  limit?: number;
  dryRun?: boolean;
};

const uniqid = require("uniqid") as () => string;

const TEMPLATE_QUERY = `
  id
  title
  sections {
    id
    publicId
    position
    cards {
      id
      publicId
      position
    }
  }
`;

const CLONE_QUERY = `
  id
  clonedFrom { id }
  sections {
    id
    publicId
    position
    cards {
      id
      publicId
      position
    }
  }
`;

type SectionRow = {
  id: string;
  publicId?: string | null;
  position?: number | null;
  cards?: CardRow[];
};

type CardRow = {
  id: string;
  publicId?: string | null;
  position?: number | null;
};

type BoardRow = {
  id: string;
  title?: string | null;
  clonedFrom?: { id: string } | null;
  sections?: SectionRow[];
};

function sortByPosition<T extends { position?: number | null }>(rows: T[]): T[] {
  return [...(rows || [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );
}

export default async function backfillProposalBoardPublicIds(
  _root: unknown,
  args: BackfillArgs,
  context: any
): Promise<string[]> {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in.");
  }
  const profile = await context.query.Profile.findOne({
    where: { id: session.itemId },
    query: "permissions { canManageUsers }",
  });
  const isAdmin = (profile?.permissions || []).some(
    (p: any) => p.canManageUsers
  );
  if (!isAdmin) {
    throw new Error(
      "Forbidden: this backfill is admin-only (canManageUsers)."
    );
  }

  const limit = Math.min(Math.max(args?.limit ?? 500, 1), 5000);
  const dryRun = args?.dryRun ?? true;
  const log: string[] = [];
  const record = (msg: string) => {
    log.push(msg);
  };

  // A "template" for propagation is any ProposalBoard that has at least one
  // clone pointing at it (ProposalBoard.prototypeFor is the inverse of
  // clonedFrom). Boards that were never cloned don't need publicIds.
  const templates = (await context.sudo().query.ProposalBoard.findMany({
    where: { prototypeFor: { some: {} } },
    take: limit,
    query: TEMPLATE_QUERY,
  })) as BoardRow[];

  record(`Found ${templates.length} templates to inspect.`);

  let templatesTouched = 0;
  let sectionsStamped = 0;
  let cardsStamped = 0;
  let clonesTouched = 0;
  let cloneSectionsStamped = 0;
  let cloneCardsStamped = 0;
  let mismatches = 0;

  for (const template of templates) {
    if (!template?.id) continue;

    // ── Pass 1: ensure template has publicIds everywhere ────────────
    const tSections = sortByPosition(template.sections || []);
    const templateSectionPublicIds: Record<string, string> = {}; // sectionId -> publicId
    const templateCardPublicIds: Record<string, Record<string, string>> = {}; // sectionId -> {cardId -> publicId}

    for (const s of tSections) {
      let publicId = s.publicId ?? null;
      if (!publicId) {
        publicId = uniqid();
        sectionsStamped += 1;
        record(
          `[template ${template.id}] section ${s.id}: stamp publicId=${publicId}`
        );
        if (!dryRun) {
          await context.db.ProposalSection.updateOne({
            where: { id: s.id },
            data: { publicId },
          });
        }
      }
      templateSectionPublicIds[s.id] = publicId!;
      templateCardPublicIds[s.id] = {};

      const tCards = sortByPosition(s.cards || []);
      for (const c of tCards) {
        let cardPublicId = c.publicId ?? null;
        if (!cardPublicId) {
          cardPublicId = uniqid();
          cardsStamped += 1;
          record(
            `[template ${template.id}] card ${c.id}: stamp publicId=${cardPublicId}`
          );
          if (!dryRun) {
            await context.db.ProposalCard.updateOne({
              where: { id: c.id },
              data: { publicId: cardPublicId },
            });
          }
        }
        templateCardPublicIds[s.id][c.id] = cardPublicId!;
      }
    }

    if (sectionsStamped > 0 || cardsStamped > 0) templatesTouched += 1;

    // ── Pass 2 & 3: for each clone, copy template's publicIds by position ─
    const clones = (await context.sudo().query.ProposalBoard.findMany({
      where: { clonedFrom: { id: { equals: template.id } } },
      query: CLONE_QUERY,
    })) as BoardRow[];

    for (const clone of clones) {
      if (!clone?.id) continue;
      const cSections = sortByPosition(clone.sections || []);

      // Length mismatch means the clone has already drifted structurally from
      // the template — align what we can by position, but flag it.
      if (cSections.length !== tSections.length) {
        mismatches += 1;
        record(
          `[clone ${clone.id} of template ${template.id}] section-count mismatch: template=${tSections.length}, clone=${cSections.length} — copying only for the overlapping prefix.`
        );
      }

      const alignedSectionCount = Math.min(tSections.length, cSections.length);
      let cloneChanged = false;

      for (let si = 0; si < alignedSectionCount; si++) {
        const tSection = tSections[si];
        const cSection = cSections[si];
        const templatePublicId = templateSectionPublicIds[tSection.id];

        // Fill clone.publicId when empty.
        if (!cSection.publicId) {
          record(
            `[clone ${clone.id}] section ${cSection.id}: copy publicId=${templatePublicId} from template section ${tSection.id}`
          );
          cloneSectionsStamped += 1;
          cloneChanged = true;
          if (!dryRun) {
            await context.db.ProposalSection.updateOne({
              where: { id: cSection.id },
              data: { publicId: templatePublicId },
            });
          }
        } else if (cSection.publicId !== templatePublicId) {
          // Both sides have a publicId but they differ. Never overwrite —
          // this indicates the clone was reparented, hand-edited, or was
          // never a true clone of this section.
          mismatches += 1;
          record(
            `[clone ${clone.id}] section ${cSection.id}: publicId mismatch (clone=${cSection.publicId}, template=${templatePublicId}) — SKIP.`
          );
        }

        // Cards inside the section.
        const tCards = sortByPosition(tSection.cards || []);
        const cCards = sortByPosition(cSection.cards || []);
        if (cCards.length !== tCards.length) {
          mismatches += 1;
          record(
            `[clone ${clone.id}] section ${cSection.id} card-count mismatch: template=${tCards.length}, clone=${cCards.length} — copying only for the overlapping prefix.`
          );
        }
        const alignedCardCount = Math.min(tCards.length, cCards.length);
        for (let ci = 0; ci < alignedCardCount; ci++) {
          const tCard = tCards[ci];
          const cCard = cCards[ci];
          const templateCardPublicId =
            templateCardPublicIds[tSection.id][tCard.id];

          if (!cCard.publicId) {
            record(
              `[clone ${clone.id}] card ${cCard.id}: copy publicId=${templateCardPublicId} from template card ${tCard.id}`
            );
            cloneCardsStamped += 1;
            cloneChanged = true;
            if (!dryRun) {
              await context.db.ProposalCard.updateOne({
                where: { id: cCard.id },
                data: { publicId: templateCardPublicId },
              });
            }
          } else if (cCard.publicId !== templateCardPublicId) {
            mismatches += 1;
            record(
              `[clone ${clone.id}] card ${cCard.id}: publicId mismatch (clone=${cCard.publicId}, template=${templateCardPublicId}) — SKIP.`
            );
          }
        }
      }

      if (cloneChanged) clonesTouched += 1;
    }
  }

  record(
    `SUMMARY: templates touched=${templatesTouched}, template sections stamped=${sectionsStamped}, template cards stamped=${cardsStamped}, clones touched=${clonesTouched}, clone sections stamped=${cloneSectionsStamped}, clone cards stamped=${cloneCardsStamped}, mismatches (skipped)=${mismatches}. dryRun=${dryRun}.`
  );

  return log;
}
