// Create or update a project_board-scoped feedback FormDefinition for
// the teacher review-form wizard. Teachers never touch storage / key /
// surface / scope — those are baked in here. Unlike
// saveClassFormDefinition, fields always write to json_bucket (no
// Opportunity.videoFile mapping). Updates edit the same row in place.
import { canMutateFormDefinition } from "../access";
import {
  normalizeFields,
  replaceCardFields,
  slugify,
} from "./saveClassFormDefinition";
import { uniqueCopiedFormKey } from "./createTemplateMilestone";
import { assertTemplateBoardTeacher } from "./resolveMilestonesForBoard";

type BoardReviewFieldInput = {
  name?: string | null;
  fieldType: string;
  label: string;
  helperText?: string | null;
  placeholder?: string | null;
  isRequired?: boolean | null;
  options?: any;
  order?: number | null;
};

type SaveBoardReviewFormDefinitionInput = {
  proposalBoardId: string;
  definitionId?: string | null;
  title: string;
  description?: string | null;
  fields: BoardReviewFieldInput[];
  publish?: boolean | null;
  milestoneKey?: string | null;
};

async function saveBoardReviewFormDefinition(
  _root: unknown,
  { input }: { input: SaveBoardReviewFormDefinitionInput },
  context: any
) {
  const {
    proposalBoardId,
    definitionId,
    title,
    description,
    fields,
    publish,
    milestoneKey,
  } = input;
  if (!proposalBoardId) throw new Error("proposalBoardId is required.");
  if (!String(title || "").trim()) throw new Error("Title is required.");

  await assertTemplateBoardTeacher(context, proposalBoardId);
  const normalizedFields = normalizeFields(fields || [], {
    allowIntroVideo: false,
  });
  const sudo = context.sudo();
  const trimmedTitle = String(title).trim();
  const trimmedDescription = description ? String(description).trim() : "";

  let defId = definitionId || null;

  if (defId) {
    const existing = await context.query.FormDefinition.findOne({
      where: { id: defId },
      query: `
        id
        scope
        proposalBoard {
          id
          templateForClasses { creator { id } }
          templatesForClass { creator { id } }
        }
        cards(orderBy: { order: asc }) { id }
      `,
    });
    if (!existing) throw new Error("Form definition not found.");
    if (
      existing.scope !== "project_board" ||
      existing.proposalBoard?.id !== proposalBoardId ||
      !canMutateFormDefinition(context.session, existing)
    ) {
      throw new Error("Forbidden: you cannot edit this form.");
    }

    await sudo.query.FormDefinition.updateOne({
      where: { id: defId },
      data: {
        title: trimmedTitle,
        description: trimmedDescription,
        surface: "feedback",
        ...(!publish ? { status: "draft" } : {}),
      },
    });

    let cardId = existing.cards?.[0]?.id;
    if (!cardId) {
      const card = await sudo.query.FormCard.createOne({
        data: {
          definition: { connect: { id: defId } },
          cardType: "fields",
          title: trimmedTitle,
          order: 0,
        },
        query: "id",
      });
      cardId = card.id;
    } else {
      await sudo.query.FormCard.updateOne({
        where: { id: cardId },
        data: { title: trimmedTitle },
      });
    }
    await replaceCardFields(sudo, cardId, normalizedFields);

    const extraCards = (existing.cards || []).slice(1);
    for (const extra of extraCards) {
      await sudo.query.FormCard.deleteOne({ where: { id: extra.id } });
    }
  } else {
    const keySeed = slugify(milestoneKey || trimmedTitle, "milestone");
    const key = await uniqueCopiedFormKey(sudo, keySeed);

    const created = await sudo.query.FormDefinition.createOne({
      data: {
        key,
        title: trimmedTitle,
        description: trimmedDescription,
        scope: "project_board",
        surface: "feedback",
        status: "draft",
        version: 1,
        proposalBoard: { connect: { id: proposalBoardId } },
      },
      query: "id",
    });
    defId = created.id;

    const card = await sudo.query.FormCard.createOne({
      data: {
        definition: { connect: { id: defId } },
        cardType: "fields",
        title: trimmedTitle,
        order: 0,
      },
      query: "id",
    });
    await replaceCardFields(sudo, card.id, normalizedFields);
  }

  if (publish) {
    if (!defId) {
      throw new Error("Form definition id missing after save.");
    }
    const publishFormDefinition = (
      await import("./publishFormDefinition")
    ).default;
    return publishFormDefinition(_root, { id: defId }, context);
  }

  return sudo.db.FormDefinition.findOne({ where: { id: defId as string } });
}

export default saveBoardReviewFormDefinition;
