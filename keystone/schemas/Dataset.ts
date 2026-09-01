import { list } from "@keystone-6/core";
import {
  json,
  text,
  timestamp,
  relationship,
  checkbox,
  select,
  integer,
} from "@keystone-6/core/fields";
import { permissions } from "../access";
const {
  buildResultAccessFilter,
  buildResultManageFilter,
} = require("../lib/runtime/resultAccess");

const resultAccess = ({ session }: any) => {
  return buildResultAccessFilter(
    session,
    !!permissions.canManageUsers({ session }),
  );
};

const resultManageAccess = ({ session }: any) =>
  buildResultManageFilter(
    session,
    !!permissions.canManageUsers({ session }),
  );

export const Dataset = list({
  access: {
    operation: {
      query: ({ session }) => !!session,
      create: () => false,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
    filter: {
      query: resultAccess,
      update: resultManageAccess,
      delete: resultManageAccess,
    },
  },
  fields: {
    token: text({
      isIndexed: "unique",
      isFilterable: true,
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
    runtimeType: select({
      options: [
        { label: "Lab.js", value: "LABJS" },
        { label: "p5.js", value: "P5" },
        { label: "jsPsych", value: "JSPSYCH" },
      ],
    }),
    runtimeAssetId: text(),
    runtimeAssetVersion: text(),
    assetAuthor: relationship({ ref: "Profile.datasetsAsAssetAuthor" }),
    taskAuthor: relationship({ ref: "Profile.datasetsAsTaskAuthor" }),
    lastSequence: integer({ defaultValue: 0 }),
    messageLog: json({ defaultValue: [] }),
    runtimeData: json({ defaultValue: [] }),
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
    // id of the StudyVersion the study was collecting data with
    studyVersion: text({ isFilterable: true }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    completedAt: timestamp(),
  },
});
