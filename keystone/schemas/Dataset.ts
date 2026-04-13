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

const canUpdateStudyField = ({ session }: { session?: any }) => {
  return isAdmin({ session })
    ? true
    : { profile: { id: { equals: session?.itemId } } };
};
const canUpdatePublicInfo = () => true;

export const Dataset = list({
  access: {
    operation: {
      query: isSignedIn,
      create: () => true, // to allow guests to create a dataset
      update: () => true, // to allow guests to update a dataset (isCompleted, when completed)
      delete: isSignedIn,
    },
    filter: {
      query: rules.canReadOwnDatasets,
      update: ({ session }) => {
        return true;
      },
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
        // Only admins can ever see or update the token
        read: isAdmin,
        create: () => true, // to allow guests to create a dataset
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

    isCompleted: checkbox({
      isFilterable: true,
      access: { update: canUpdatePublicInfo },
    }),

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

    completedAt: timestamp({ access: { update: canUpdatePublicInfo } }),
  },
});
