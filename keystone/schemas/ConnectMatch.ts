import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  float,
} from "@keystone-6/core/fields";
import { rules, isSignedIn } from "../access";

export const ConnectMatch = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: rules.connectMatchVisible,
      update: rules.connectMatchVisible,
      delete: rules.connectMatchVisible,
    },
  },
  fields: {
    round: relationship({
      ref: "ConnectRound.matches",
    }),
    classNetwork: relationship({
      ref: "ClassNetwork.matches",
    }),
    opportunity: relationship({
      ref: "Opportunity.matches",
    }),
    student: relationship({
      ref: "Profile.connectMatches",
    }),

    status: select({
      options: [
        { label: "Proposed", value: "proposed" },
        { label: "Active", value: "active" },
        { label: "Completed", value: "completed" },
        { label: "Declined", value: "declined" },
        { label: "Cancelled", value: "cancelled" },
      ],
      defaultValue: "proposed",
    }),

    matchScore: float(),

    teacherNotes: text({ ui: { displayMode: "textarea" } }),

    ratings: relationship({
      ref: "ConnectRating.match",
      many: true,
    }),

    createdBy: relationship({
      ref: "Profile.connectMatchesCreated",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create" && !inputData.createdBy) {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.createdBy;
        },
      },
    }),

    proposedAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    activatedAt: timestamp(),
    completedAt: timestamp(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
