import { checkbox } from "@keystone-6/core/fields";

export const permissionFields = {
  canAccessAdminUI: checkbox({
    defaultValue: false,
    label: "User can access Admin UI",
  }),
  canManageUsers: checkbox({
    defaultValue: false,
    label: "User can edit other users",
  }),
  canManageRoles: checkbox({
    defaultValue: false,
    label: "User can create and edit roles",
  }),
  canManageProjects: checkbox({
    defaultValue: false,
    label: "User can manage projects",
  }),
  canManageStudies: checkbox({
    defaultValue: false,
    label: "User can manage studies",
  }),
  canManageUserImages: checkbox({
    defaultValue: false,
    label: "User can manage user images",
  }),
  canManageTemplates: checkbox({
    defaultValue: false,
    label: "User can manage templates",
  }),
  canManageTasks: checkbox({
    defaultValue: false,
    label: "User can manage tasks",
  }),
  canManageJournals: checkbox({
    defaultValue: false,
    label: "User can manage journals",
  }),
  canManageDatasets: checkbox({
    defaultValue: false,
    label: "User can manage datasets",
  }),
};

export type Permission = keyof typeof permissionFields;

export const permissionsList: Permission[] = Object.keys(
  permissionFields,
) as Permission[];
