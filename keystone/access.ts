// access functions, the access control returns yes or no

import { permissionsList } from "./schemas/fields";
import { ListAccessArgs } from "./types";

export function isSignedIn({ session }: ListAccessArgs) {
  return !!session; // if undefinened, return false
}

const generatedPermissions = Object.fromEntries(
  permissionsList.map((permission) => [
    permission,
    function ({ session }: ListAccessArgs) {
      return !!session?.data.role?.[permission];
    },
  ])
);

// Permissions check if someone meets a criteris - yes or no
export const permissions = {
  ...generatedPermissions,
  isAwesome({ session }: ListAccessArgs) {
    return session?.data.email === "shevchenko_yury@mail.ru";
  },
};

// Rule based functions
// rules can return a boolean or a filter that limits which products they can CRUD
export const rules = {
  canEditAdminUI({ session, item, listKey, context }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return "hidden";
    }
    // Do they have the the admin permission?
    if (permissions.isAwesome({ session })) {
      return "edit";
    }
    return "hidden";
  },
  canReadAdminUI({ session, item, listKey, context }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return "hidden";
    }
    // Do they have the the admin permission?
    if (permissions.isAwesome({ session })) {
      return "read";
    }
    return "hidden";
  },
  canManageUsers({ session, item, listKey, context }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the the admin permission
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    // 2. Otherwise, they may only update themselves
    if (item.id === session.itemId) {
      return true;
    }
    // allow the follow user mutation
    if (
      context?.req?.body?.operationName === "FOLLOW_USER_MUTATION" ||
      context?.req?.body?.operationName === "UNFOLLOW_USER_MUTATION"
    ) {
      return true;
    }
  },
  canManagePosts({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the admin permission
    if (permissions.canManagePosts({ session })) {
      return true;
    }
    // 2. Otherwise, they may only update themselves
    if (item.authorId === session.itemId) {
      return true;
    }
  },
  canManageCollections({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the admin permission
    if (permissions.canManageCollections({ session })) {
      return true;
    }
    // 2. If not, do they own this item
    if (item.ownerId === session.itemId) {
      return true;
    }
  },
  canManageContracts({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the admin permission
    if (permissions.canManageContracts({ session })) {
      return true;
    }
    // 2. If not, are they a customer or a client
    if (
      item.customerId === session.itemId ||
      item.supplierId === session.itemId
    ) {
      return true;
    }
  },
  canManageProposals({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the admin permission
    if (permissions.canManageProposals({ session })) {
      return true;
    }
    // 2. If not, are they a customer or a client
    if (item.fromId === session.itemId || item.toId === session.itemId) {
      return true;
    }
  },
  canManagePriceBids({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the admin permission
    if (permissions.canManagePriceBids({ session })) {
      return true;
    }
    // 2. If not, are they a customer or a client
    if (item.fromId === session.itemId || item.toId === session.itemId) {
      return true;
    }
  },
  canManageTransactions({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the admin permission
    if (permissions.canManageTransactions({ session })) {
      return true;
    }
    // 2. If not, are they a customer or a client
    if (item.fromId === session.itemId || item.toId === session.itemId) {
      return true;
    }
  },
  canManageUserImages({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the permission of canManageUsers
    if (permissions.canManageUserImages({ session })) {
      return true;
    }
    // 2. If not, do they own this item
    if (item.userId === session.itemId) {
      return true;
    }
  },
  canManageRoles({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageRoles({ session })) {
      return true;
    }
    if (permissions.isAwesome({ session })) {
      return true;
    }
    return false;
  },
  canManageTemplates({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the admin permission
    if (permissions.canManageTemplates({ session })) {
      return true;
    }
    // 2. If not, are they are a template author
    if (item.author === session.itemId) {
      return true;
    }
  },
  canManageTasks({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the admin permission
    if (permissions.canManageTasks({ session })) {
      return true;
    }
    // 2. If not, are they are a template author
    if (item.author === session.itemId) {
      return true;
    }
  },
  canManageProjects({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the admin permission
    if (permissions.canManageProjects({ session })) {
      return true;
    }
    // 2. If not, are they are a template author
    if (item.author === session.itemId) {
      return true;
    }
  },
};
