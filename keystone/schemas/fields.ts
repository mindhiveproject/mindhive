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
  // Deliberately separate from canManageUsers. Triaging platform tickets and
  // editing user accounts are unrelated rights: a designer or mentor may need
  // the first without the second, and nobody should inherit the ticket board
  // (including every screenshot on it) by being granted account access for an
  // unrelated reason.
  canManageTickets: checkbox({
    defaultValue: false,
    label: "User can file and triage platform tickets",
  }),
};

export type Permission = keyof typeof permissionFields;

export const permissionsList: Permission[] = Object.keys(
  permissionFields
) as Permission[];
