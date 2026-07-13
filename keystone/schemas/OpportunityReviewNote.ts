import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
} from "@keystone-6/core/fields";
import { rules, isSignedIn, permissions } from "../access";

function connectId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const rel = value as { connect?: { id?: string } };
  return rel.connect?.id ? String(rel.connect.id) : null;
}

async function canCreateReviewNoteForPair(
  context: any,
  roundId: string,
  opportunityId: string,
  userId: string
): Promise<boolean> {
  if (permissions.canManageUsers({ session: context.session })) return true;

  const round = await context.sudo().query.ConnectRound.findOne({
    where: { id: roundId },
    query: `
      id
      createdBy { id }
      reviewers { id }
      classNetwork {
        id
        creator { id }
        classes { id creator { id } }
      }
    `,
  });
  if (!round) return false;

  const opportunity = await context.sudo().query.Opportunity.findOne({
    where: { id: opportunityId },
    query: `id mentor { id }`,
  });
  if (!opportunity) return false;

  if (round.createdBy?.id === userId) return true;
  if ((round.reviewers || []).some((r: { id: string }) => r.id === userId)) {
    return true;
  }
  if (opportunity.mentor?.id === userId) return true;
  if (round.classNetwork?.creator?.id === userId) return true;
  if (
    (round.classNetwork?.classes || []).some(
      (c: { creator?: { id: string } }) => c.creator?.id === userId
    )
  ) {
    return true;
  }

  return false;
}

// A reviewer's note on an opportunity within the context of a specific
// matching round. The (opportunity, round) pair scopes the note —
// reviewing the same opportunity in a different round produces a
// separate audit trail.
//
// Visibility: the author, any reviewer on the same round, the round
// creator, class-network/class teachers, the opportunity's mentor, and
// admins. Mutate: author or admin (notes are owned by the person who wrote them).
export const OpportunityReviewNote = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: rules.connectReviewNoteVisible,
      update: rules.connectReviewNoteMutate,
      delete: rules.connectReviewNoteMutate,
    },
  },
  fields: {
    opportunity: relationship({
      ref: "Opportunity.reviewNotes",
    }),
    round: relationship({
      ref: "ConnectRound.reviewNotes",
    }),
    body: text({
      validation: { isRequired: true },
      ui: { displayMode: "textarea" },
    }),
    author: relationship({
      ref: "Profile.opportunityReviewNotes",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create" && !inputData.author) {
            return { connect: { id: context.session?.itemId } };
          }
          return inputData.author;
        },
      },
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
  hooks: {
    async resolveInput({ resolvedData, operation }) {
      if (operation === "update") {
        return { ...resolvedData, updatedAt: new Date() };
      }
      return resolvedData;
    },
    validateInput: async ({
      operation,
      resolvedData,
      context,
      addValidationError,
    }) => {
      if (operation !== "create") return;

      const roundId = connectId(resolvedData.round);
      const opportunityId = connectId(resolvedData.opportunity);
      const userId = context.session?.itemId;

      if (!roundId || !opportunityId) {
        addValidationError(
          "Review notes must be linked to both an opportunity and a matching round."
        );
        return;
      }
      if (!userId) {
        addValidationError("You must be signed in to leave a review note.");
        return;
      }

      const allowed = await canCreateReviewNoteForPair(
        context,
        roundId,
        opportunityId,
        userId
      );
      if (!allowed) {
        addValidationError(
          "You are not allowed to leave a review note on this opportunity for this round."
        );
      }
    },
  },
});
