import { checkbox } from "@keystone-6/core/fields";

export const permissionFields = {
  canManageUsers: checkbox({
    defaultValue: false,
    label: "User can Edit other users",
  }),
  canAccessAdminUI: checkbox({
    defaultValue: false,
    label: "User can access Admin UI",
  }),
};

export type Permission = keyof typeof permissionFields;

export const permissionsList: Permission[] = Object.keys(
  permissionFields
) as Permission[];
