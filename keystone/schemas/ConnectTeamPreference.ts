import { list } from "@keystone-6/core";
import {
  relationship,
  timestamp,
  integer,
} from "@keystone-6/core/fields";
import { rules, isSignedIn } from "../access";

export const ConnectTeamPreference = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: rules.connectOwnerOrRoundCreator,
      update: rules.connectOwnerOrRoundCreator,
      delete: rules.connectOwnerOrRoundCreator,
    },
  },
  fields: {
    round: relationship({
      ref: "ConnectRound.teamPreferences",
    }),
    opportunity: relationship({
      ref: "Opportunity.teamPreferences",
    }),

    submitter: relationship({
      ref: "Profile.teamPreferencesSubmitted",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create" && !inputData.submitter) {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.submitter;
        },
      },
    }),
    preferredTeammate: relationship({
      ref: "Profile.teamPreferencesReceived",
    }),

    priority: integer({ defaultValue: 1 }),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
  },
});
