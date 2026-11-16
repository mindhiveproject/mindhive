import { list } from "@keystone-6/core";
const { uniqueSlug } = require("../lib/uniqueSlug");
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  integer,
  checkbox,
  json,
} from "@keystone-6/core/fields";

import { signedInWrites, authorOrCollaboratorFilter, authorFilter } from "../access";

export const Template = list({
  access: {
    // Anyone may read (participants need studies/tasks); changes need a
    // signed-in owner.
    operation: signedInWrites,
    filter: {
      update: authorOrCollaboratorFilter,
      delete: authorFilter,
    },
  },
  fields: {
    title: text({ validation: { isRequired: true } }),
    i18nContent: json(),
    slug: text({
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            const { title } = inputData;
            if (title) {
              return uniqueSlug(context, "Template", title);
            }
          } else {
            return inputData.slug;
          }
        },
      },
    }),
    shortDescription: text(),
    description: text(),
    author: relationship({
      ref: "Profile.templates",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            return { connect: { id: context.session.itemId } };
          } else {
            return inputData.author;
          }
        },
      },
    }),
    collaborators: relationship({
      ref: "Profile.collaboratorInTemplate",
      many: true,
    }),
    parameters: json(),
    docs: json(),
    version: text({ defaultValue: "1" }),
    published: checkbox({ defaultValue: false }),
    fileAddress: text(),
    scriptAddress: text(),
    style: text(),
    tasks: relationship({
      ref: "Task.template",
      many: true,
    }),
    datasets: relationship({
      ref: "Dataset.template",
      many: true,
    }),
    summaryResults: relationship({
      ref: "SummaryResult.template",
      many: true,
    }),
    settings: json(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
