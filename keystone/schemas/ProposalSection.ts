import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  float,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import slugify from "slugify";

import { signedInWrites } from "../access";

export const ProposalSection = list({
  access: {
    // Anyone may read; changes need a signed-in user.
    operation: signedInWrites,
  },
  fields: {
    title: text({ validation: { isRequired: true } }),
    publicId: text(),
    description: text(),
    position: float(),
    board: relationship({
      ref: "ProposalBoard.sections",
    }),
    cards: relationship({
      ref: "ProposalCard.section",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
