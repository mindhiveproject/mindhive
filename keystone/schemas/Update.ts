// schemas/Update.ts

import { list } from "@keystone-6/core";
import {
  relationship,
  checkbox,
  json,
  text,
  timestamp,
} from "@keystone-6/core/fields";
import { isSignedIn, isAdmin, rules } from "../access";

export const Update = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // What items a user can see:
      // - Admins: all
      // - Others: updates linked to their Profile
      query: rules.canReadOwnUpdates,
      // Who can update/delete:
      // - Admins: all
      // - Others: their own updates
      update: rules.canReadOwnUpdates,
      delete: rules.canReadOwnUpdates,
    },
  },

  fields: {
    user: relationship({
      ref: "Profile.updates",
    }),

    updateArea: text(),

    link: text(),

    content: json(),

    hasOpen: checkbox({ isFilterable: true }),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),

    updatedAt: timestamp(),
  },
});
