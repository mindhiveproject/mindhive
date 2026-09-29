import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  integer,
  checkbox,
} from "@keystone-6/core/fields";
import { permissions } from "../access";
import { permissionFields } from "./fields";

export const Permission = list({
  access: {
    operation: {
      query: () => true,
      create: ({ session }) => permissions.canManageUsers({ session }),
      update: ({ session }) => permissions.canManageUsers({ session }),
      delete: ({ session }) => permissions.canManageUsers({ session }),
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
    reviewableMilestones: relationship({
      ref: "Milestone.canReview",
      many: true,
    }),
  },
});
