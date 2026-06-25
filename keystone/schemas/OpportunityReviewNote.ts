import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
} from "@keystone-6/core/fields";
import { rules, isSignedIn } from "../access";

// A reviewer's note on an opportunity within the context of a specific
// matching round. The (opportunity, round) pair scopes the note —
// reviewing the same opportunity in a different round produces a
// separate audit trail.
//
// Visibility: the author, any reviewer on the same round, the round
// creator, the opportunity's mentor, and admins. Mutate: author or
// admin (notes are owned by the person who wrote them).
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
  },
});
