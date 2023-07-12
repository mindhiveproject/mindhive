import { checkbox } from '@keystone-6/core/fields';

export const permissionFields = {
  canManageUsers: checkbox({
    defaultValue: false,
    label: "User can Edit other users",
  }),
};

export type Permission = keyof typeof permissionFields;

export const permissionsList: Permission[] = Object.keys(
  permissionFields
) as Permission[];
