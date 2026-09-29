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

import { signedInWrites } from "../access";

export const Spec = list({
  access: {
    // Anyone may read; changes need a signed-in user.
    operation: signedInWrites,
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
