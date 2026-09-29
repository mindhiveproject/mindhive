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
// chat message
export const Word = list({
  access: {
    // Anyone may read; changes need a signed-in user.
    operation: signedInWrites,
  },
  fields: {
    author: relationship({
      ref: "Profile.authorOfWord",
      hooks: {
        async resolveInput({ operation, resolvedData, context }) {
          if (operation === "create") {
            return { connect: { id: context.session.itemId } };
          }
          return resolvedData.author;
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
