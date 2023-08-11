import { list } from "@keystone-6/core";
import {
  json,
  text,
  timestamp,
  relationship,
  checkbox,
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
    profile: relationship({
      ref: "Profile.datasets",
    }),
    template: relationship({
      ref: "Template.datasets",
    }),
    task: relationship({
      ref: "Task.datasets",
    }),
    study: relationship({
      ref: "Study.datasets",
    }),
    dataPolicy: text(),
    info: json(),
    isCompleted: checkbox({ isFilterable: true }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
