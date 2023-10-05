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

export const SummaryResult = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
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
