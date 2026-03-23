import { list } from "@keystone-6/core";
import { text, relationship } from "@keystone-6/core/fields";
import { isSignedIn, isAdmin } from "../access";

export const YQTag = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isAdmin,
      update: isAdmin,
      delete: isAdmin,
    },
  },
  fields: {
    label: text(),
    visuals: relationship({ ref: "Visual.tags", many: true }),
  },
});
