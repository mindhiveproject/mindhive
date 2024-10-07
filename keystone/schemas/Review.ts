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

export const Review = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    author: relationship({
      ref: "Profile.reviews",
    }),
    study: relationship({
      ref: "Study.reviews",
    }),
    proposal: relationship({
      ref: "ProposalBoard.reviews",
    }),
    settings: json(),
    content: json(),
    stage: select({
      options: [
        { label: "Individual", value: "INDIVIDUAL" },
        { label: "Synthesis", value: "SYNTHESIS" },
        { label: "Proposal", value: "SUBMITTED_AS_PROPOSAL" },
        { label: "In review", value: "IN_REVIEW" },
      ],
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
