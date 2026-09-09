import { list } from "@keystone-6/core";
import {
  json,
  text,
  timestamp,
  relationship,
  checkbox,
  select,
} from "@keystone-6/core/fields";
import { permissions } from "../access";
const {
  buildResultManageFilter,
  buildSummaryAccessFilter,
} = require("../lib/runtime/resultAccess");

const resultAccess = ({ session }: any) => {
  return buildSummaryAccessFilter(
    session,
    !!permissions.canManageUsers({ session }),
  );
};

const resultManageAccess = ({ session }: any) =>
  buildResultManageFilter(
    session,
    !!permissions.canManageUsers({ session }),
  );

export const SummaryResult = list({
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
    runtimeType: select({
      options: [
        { label: "Lab.js", value: "LABJS" },
        { label: "p5.js", value: "P5" },
        { label: "jsPsych", value: "JSPSYCH" },
      ],
    }),
    runtimeAssetId: text(),
    runtimeAssetVersion: text(),
    assetAuthor: relationship({ ref: "Profile.summaryResultsAsAssetAuthor" }),
    taskAuthor: relationship({ ref: "Profile.summaryResultsAsTaskAuthor" }),
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
