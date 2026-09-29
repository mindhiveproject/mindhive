import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  integer,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import slugify from "slugify";

import { authorFilter, isSignedIn } from "../access";

export const Review = list({
  access: {
    // Reviews are shared with signed-in users (Feedback Center). Only the
    // author edits a review; upvotes go through toggleReviewUpvote (sudo).
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      update: authorFilter,
      delete: authorFilter,
    },
  },
  fields: {
    author: relationship({
      ref: "Profile.reviews",
      hooks: {
        // A review is always filed by the signed-in user.
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create" && context.session?.itemId) {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.author;
        },
      },
    }),
    study: relationship({
      ref: "Study.reviews",
    }),
    proposal: relationship({
      ref: "ProposalBoard.reviews",
    }),
    settings: json(),
    content: json(),
    stage: text({
      isFilterable: true,
      isIndexed: true,
    }),
    milestone: relationship({
      ref: "Milestone.reviews",
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
    upvotedBy: relationship({
      ref: "Profile.reviewsUpvoted",
      many: true,
    }),
  },
});
