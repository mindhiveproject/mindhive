import { list } from "@keystone-6/core";
import { text, relationship } from "@keystone-6/core/fields";
import { permissionFields } from "./fields";
import { isSignedIn, rules } from "../access";

export const Permission = list({
  access: {
    operation: {
      query: ({ session }) =>
        isSignedIn({ session }) && rules.canManageRoles({ session }),
      create: ({ session }) => rules.canManageRoles({ session }),
      update: ({ session }) => rules.canManageRoles({ session }),
      delete: ({ session }) => rules.canManageRoles({ session }),
    },
  },
  fields: {
    name: text({
      validation: { isRequired: true },
      isIndexed: "unique",
      isFilterable: true,
    }),
    ...permissionFields,
    assignedTo: relationship({
      ref: "Profile.permissions",
      many: true,
      ui: {
        itemView: { fieldMode: "read" },
      },
    }),
  },
});
