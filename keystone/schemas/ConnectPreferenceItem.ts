import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  integer,
} from "@keystone-6/core/fields";
import { rules, isSignedIn } from "../access";

export const ConnectPreferenceItem = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: rules.connectPreferenceItemVisible,
      update: rules.connectPreferenceItemVisible,
      delete: rules.connectPreferenceItemVisible,
    },
  },
  fields: {
    preference: relationship({
      ref: "ConnectPreference.items",
    }),
    opportunity: relationship({
      ref: "Opportunity.preferenceItems",
    }),

    rank: integer(),
    starRating: integer(),
    comment: text({ ui: { displayMode: "textarea" } }),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
  },
});
