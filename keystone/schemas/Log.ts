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
        {
          label: "Proposal is submitted for peer review",
          value: "PROPOSAL_SUBMITTED_FOR_PEER_REVIEW",
        },
        {
          label: "Study is submitted for data collection",
          value: "STUDY_SUBMITTED_FOR_DATA_COLLECTION",
        },
        {
          label: "Project is submitted for report",
          value: "PROJECT_SUBMITTED_FOR_REPORT",
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
