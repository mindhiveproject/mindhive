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

export const Spec = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    title: text(),
    description: text(),
    isPublic: checkbox({ isFilterable: true }),
    isTemplate: checkbox({ isFilterable: true }),
    isFeatured: checkbox({ isFilterable: true }),
    settings: json(),
    content: json(),
    author: relationship({
      ref: "Profile.authoredSpecs",
      hooks: {
        async resolveInput({ context }) {
          return { connect: { id: context.session.itemId } };
        },
      },
    }), 
    studies: relationship({
      ref: "Study.specs",
      many: true,
    }),
    tags: relationship({
      ref: "Tag.specs",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
