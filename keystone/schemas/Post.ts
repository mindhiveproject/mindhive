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

export const Post = list({
  access: {
    // Anyone may read; changes need a signed-in user.
    operation: signedInWrites,
  },
  fields: {
    title: text(),
    content: text(),
    author: relationship({
      ref: "Profile.posts",
      hooks: {
        async resolveInput({ context }) {
          return { connect: { id: context.session.itemId } };
        },
      },
    }),
    journal: relationship({
      ref: "Journal.posts",
    }),
    settings: json(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
