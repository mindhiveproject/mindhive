import { list } from "@keystone-6/core";
import {
  json,
  text,
  timestamp,
  relationship,
  checkbox,
  select,
} from "@keystone-6/core/fields";
// import { rules } from "../access";

export const Dataset = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
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
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    completedAt: timestamp(),
  },
});
