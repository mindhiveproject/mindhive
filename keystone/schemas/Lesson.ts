import { list } from "@keystone-6/core";
const { uniqueSlug } = require("../lib/uniqueSlug");
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  float,
  checkbox,
  json,
} from "@keystone-6/core/fields";

import { signedInWrites } from "../access";

export const Lesson = list({
  access: {
    // Anyone may read; changes need a signed-in user.
    operation: signedInWrites,
  },
  fields: {
    title: text({ validation: { isRequired: true } }),
    slug: text({
      validation: { isRequired: true },
      isIndexed: "unique",
      isFilterable: true,
      hooks: {
        async resolveInput({ context, inputData }) {
          const { title } = inputData;
          if (title) {
            return uniqueSlug(context, "Lesson", title);
          }
        },
      },
    }),
    description: text(),
    type: text(),
    content: text(),
    settings: json(),
    author: relationship({
      ref: "Profile.authorOfLesson",
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
      ref: "Profile.collaboratorInLesson",
      many: true,
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            return { connect: { id: context.session.itemId } };
          } else {
            return inputData.collaborators;
          }
        },
      },
    }),
    isPublic: checkbox({ isFilterable: true }),
    isFeatured: checkbox({ isFilterable: true }),
    parent: relationship({
      ref: "Lesson.children",
    }),
    children: relationship({
      ref: "Lesson.parent",
      many: true,
    }),
    tags: relationship({
      ref: "Tag.lessons",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
