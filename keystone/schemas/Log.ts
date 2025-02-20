import { list } from "@keystone-6/core";
import {
  relationship,
  checkbox,
  json,
  text,
  timestamp,
  select,
} from "@keystone-6/core/fields";

export const Log = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    user: relationship({
      ref: "Profile.logs",
    }),
    proposal: relationship({
      ref: "ProposalBoard.logs",
    }),
    class: relationship({
      ref: "Class.logs",
    }),
    study: relationship({
      ref: "Study.logs",
    }),
    event: select({
      options: [
        {
          label: "Proposal is submitted for expert review",
          value: "PROPOSAL_SUBMITTED_FOR_REVIEW",
        },
      ],
    }),
    content: json(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
