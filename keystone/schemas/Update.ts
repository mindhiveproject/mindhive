import { list } from "@keystone-6/core";
import {
  relationship,
  checkbox,
  json,
  text,
  timestamp,
} from "@keystone-6/core/fields";
// import { rules } from "../access";

export const Update = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    user: relationship({
      ref: "Profile.updates",
    }),
    updateArea: text(),
    link: text(),
    content: json(),
    hasOpen: checkbox({ isFilterable: true }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
