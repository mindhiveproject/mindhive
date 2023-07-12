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

// chat forum
export const Talk = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    author: relationship({
      ref: "Profile.authorOfTalk",
      hooks: {
        async resolveInput({ context }) {
          return { connect: { id: context.session.itemId } };
        },
      },
    }),
    members: relationship({
      ref: "Profile.memberOfTalk",
      many: true,
    }),
    words: relationship({
      ref: "Word.talk",
      many: true,
    }),
    settings: json(),
    studies: relationship({
      ref: "Study.talks",
      many: true,
    }),
    classes: relationship({
      ref: "Class.talks",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
