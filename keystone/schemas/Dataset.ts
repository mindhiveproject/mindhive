// schemas/Dataset.ts

import { list } from "@keystone-6/core";
import {
  json,
  text,
  timestamp,
  relationship,
  checkbox,
  select,
} from "@keystone-6/core/fields";
import { isSignedIn, isAdmin, rules } from "../access";

export const Dataset = list({
  access: {
    operation: {
      // Only authenticated users can see/create; updates/deletes are restricted further
      query: isSignedIn,
      create: isSignedIn, // typically via backend processes; you can tighten later if needed
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // What items a user can see:
      // - Admins: all
      // - Others: datasets linked to their Profile (rules.canReadOwnDatasets)
      query: rules.canReadOwnDatasets,
      // Who can update/delete:
      // - Admins: all
      // - Others: only their own datasets, and only for delete here
      update: ({ session }) =>
        isAdmin({ session })
          ? true
          : { profile: { id: { equals: session?.itemId } } },
      delete: ({ session }) =>
        isAdmin({ session })
          ? true
          : { profile: { id: { equals: session?.itemId } } },
    },
  },

  fields: {
    token: text({
      isIndexed: "unique",
      isFilterable: true,
      access: {
        // Only admins can ever see or set the token
        read: isAdmin,
        create: isAdmin,
        update: isAdmin,
      },
    }),

    date: text(),

    profile: relationship({
      ref: "Profile.datasets",
    }),

    guest: relationship({
      ref: "Guest.datasets",
    }),

    type: select({
      options: [
        { label: "Guest", value: "GUEST" },
        { label: "User", value: "USER" },
      ],
    }),

    template: relationship({
      ref: "Template.datasets",
    }),

    task: relationship({
      ref: "Task.datasets",
    }),

    testVersion: text(),

    study: relationship({
      ref: "Study.datasets",
    }),

    summaryResult: relationship({
      ref: "SummaryResult.fullResult",
    }),

    dataPolicy: text(),

    info: json(),

    isCompleted: checkbox({ isFilterable: true }),

    isIncluded: checkbox({ isFilterable: true, defaultValue: false }),

    studyStatus: select({
      options: [
        { label: "Working", value: "WORKING" },
        { label: "Proposal", value: "SUBMITTED_AS_PROPOSAL" },
        { label: "Ready for review", value: "READY_FOR_REVIEW" },
        { label: "In review", value: "IN_REVIEW" },
        { label: "Reviewed", value: "REVIEWED" },
        { label: "Collecting data", value: "COLLECTING_DATA" },
        {
          label: "Data collection is completed",
          value: "DATA_COLLECTION_IS_COMPLETED",
        },
      ],
      defaultValue: "WORKING",
    }),

    studyVersion: text(),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),

    completedAt: timestamp(),
  },
});
