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
// chat forum
export const Talk = list({
  access: {
    // Anyone may read; changes need a signed-in user.
    operation: signedInWrites,
  },
  fields: {
    author: relationship({
      ref: "Profile.authorOfTalk",
      hooks: {
        async resolveInput({ operation, resolvedData, context }) {
          if (operation === "create") {
            return { connect: { id: context.session.itemId } };
          }
          return resolvedData.author;
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
    opportunities: relationship({
      ref: "Opportunity.talks",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
