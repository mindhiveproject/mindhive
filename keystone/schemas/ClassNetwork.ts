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

export const ClassNetwork = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    title: text({ isIndexed: "unique", validation: { isRequired: true } }),
    description: text(),
    settings: json(),
    creator: relationship({
      ref: "Profile.classNetworksCreated",
      ui: {
        displayMode: "cards",
        cardFields: ["username", "email"],
        // inlineEdit: { fields: ['username', 'email'] },
        linkToItem: true,
        // inlineCreate: { fields: ['username', 'email'] },
      },
    }),
    classes: relationship({ ref: "Class.networks", many: true }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
