// schemas/SummaryResult.ts

import { list } from "@keystone-6/core";
import {
  json,
  text,
  timestamp,
  relationship,
  select,
} from "@keystone-6/core/fields";
import { isSignedIn, isAdmin, rules } from "../access";

export const SummaryResult = list({
  access: {
    operation: {
      // Only authenticated users can query; writes are admin-only
      query: isSignedIn,
      create: isAdmin,
      update: isAdmin,
      delete: isAdmin,
    },
    filter: {
      // What items a user can see:
      // - Admins: all
      // - Others: results linked to their Profile (rules.canReadOwnSummaryResults)
      query: rules.canReadOwnSummaryResults,
      // For update/delete we already restricted by operation.isAdmin above,
      // so no extra filter is strictly necessary, but we can be explicit:
      update: ({ session }) => (isAdmin({ session }) ? true : false),
      delete: ({ session }) => (isAdmin({ session }) ? true : false),
    },
  },

  fields: {
    user: relationship({
      ref: "Profile.summaryResults",
    }),

    guest: relationship({
      ref: "Guest.summaryResults",
    }),

    type: select({
      options: [
        { label: "Guest", value: "GUEST" },
        { label: "User", value: "USER" },
      ],
    }),

    study: relationship({
      ref: "Study.summaryResults",
    }),

    template: relationship({
      ref: "Template.summaryResults",
    }),

    task: relationship({
      ref: "Task.summaryResults",
    }),

    testVersion: text(),

    metadataId: text(),

    dataPolicy: text(),

    fullResult: relationship({
      ref: "Dataset.summaryResult",
    }),

    data: json(),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),

    updatedAt: timestamp(),
  },
});
