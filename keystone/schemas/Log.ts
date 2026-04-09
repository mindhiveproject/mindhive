import { list } from "@keystone-6/core";
import {
  relationship,
  json,
  text,
  timestamp,
  select,
} from "@keystone-6/core/fields";
import { isSignedIn, isAdmin } from "../access";

export const Log = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isAdmin,
      delete: isAdmin,
    },
    filter: {
      // Admins: all; others: logs related to them (user)
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : { user: { id: { equals: session?.itemId } } },
      update: ({ session }) => (isAdmin({ session }) ? true : false),
      delete: ({ session }) => (isAdmin({ session }) ? true : false),
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
