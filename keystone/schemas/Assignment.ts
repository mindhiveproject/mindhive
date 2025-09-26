import { list } from "@keystone-6/core";
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
import uniqid from "uniqid";

export const Assignment = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    code: text({
      isIndexed: "unique",
      isFilterable: true,
      access: {
        read: () => true,
        create: () => true,
        update: () => true,
      },
      hooks: {
        async resolveInput({ operation }) {
          if (operation === "create") {
            return uniqid();
          }
        },
      },
    }),
    author: relationship({
      ref: "Profile.authorOfAssignment",
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
    classes: relationship({
      ref: "Class.assignments",
      many: true,
    }),
    homework: relationship({
      ref: "Homework.assignment",
      many: true,
    }),
    proposalCards: relationship({
      ref: "ProposalCard.assignments",
      many: true,
    }),
    title: text({ validation: { isRequired: true } }),
    content: text(),
    placeholder: text(),
    settings: json(),
    public: checkbox({ isFilterable: true }),
    isTemplate: checkbox({ isFilterable: true }),
    tags: relationship({
      ref: "Tag.assignments",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
