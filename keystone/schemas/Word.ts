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

// chat message
export const Word = list({
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
      ref: "Profile.authorOfWord",
      hooks: {
        async resolveInput({ context }) {
          return { connect: { id: context.session.itemId } };
        },
      },
    }),
    talk: relationship({
      ref: "Talk.words",
    }),
    message: text(),
    new: checkbox(),
    settings: json(),
    isMain: checkbox(),
    parent: relationship({
      ref: "Word.children",
    }),
    children: relationship({
      ref: "Word.parent",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
