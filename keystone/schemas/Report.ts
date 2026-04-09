import { list } from "@keystone-6/core";
import { text, timestamp } from "@keystone-6/core/fields";
import { isSignedIn, isAdmin } from "../access";

export const Report = list({
  access: {
    operation: {
      // reports likely admin-only
      query: isAdmin,
      create: isAdmin,
      update: isAdmin,
      delete: isAdmin,
    },
  },
  fields: {
    message: text(),
    dateCreated: timestamp({
      defaultValue: { kind: "now" },
    }),
  },
});
