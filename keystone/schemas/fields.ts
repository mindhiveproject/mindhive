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
  canManageForms: checkbox({
    defaultValue: false,
    label: "User can manage Connect form definitions",
  }),
};

export type Permission = keyof typeof permissionFields;

export const permissionsList: Permission[] = Object.keys(
  permissionFields
) as Permission[];
