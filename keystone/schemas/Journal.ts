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

export const Journal = list({
  access: {
    // Anyone may read; changes need a signed-in user.
    operation: signedInWrites,
  },
  fields: {
    code: text({ isIndexed: "unique" }),
    title: text({ validation: { isRequired: true } }),
    description: text(),
    creator: relationship({
      ref: "Profile.journals",
      hooks: {
        async resolveInput({ context }) {
          return { connect: { id: context.session.itemId } };
        },
      },
    }),
    posts: relationship({
      ref: "Post.journal",
      many: true,
    }),
    settings: json(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
