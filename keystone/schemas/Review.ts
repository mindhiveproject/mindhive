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

import { signedInWrites } from "../access";

export const Review = list({
  access: {
    // Anyone may read; changes need a signed-in user.
    operation: signedInWrites,
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
