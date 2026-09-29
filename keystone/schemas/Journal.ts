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

import {
  signedInWrites,
  journalQueryFilter,
  journalOwnerFilter,
} from "../access";

export const Journal = list({
  access: {
    // Owner reads and writes; staff of the owner's classes may read.
    operation: signedInWrites,
    filter: {
      query: journalQueryFilter,
      update: journalOwnerFilter,
      delete: journalOwnerFilter,
    },
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
