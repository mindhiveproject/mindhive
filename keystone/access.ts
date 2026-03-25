// access.ts
// Central access-control helpers for Keystone lists

import { permissionsList } from "./schemas/fields";
import { ListAccessArgs } from "./types";

// ---------- Basic helpers ----------

export function isSignedIn({ session }: ListAccessArgs) {
  return !!session;
}

export function isAdmin({ session }: ListAccessArgs) {
  return !!session && permissions.canManageUsers({ session });
}

export function isSelf({ session, item }: ListAccessArgs & { item?: any }) {
  if (!session || !item) return false;
  return item.id === session.itemId;
}

export function isSuperAdmin({ session }: ListAccessArgs) {
  return !!session && session?.data.username === "shevchenko_yury";
}

// ---------- Generated permissions ----------

const generatedPermissions = Object.fromEntries(
  permissionsList.map((permission) => [
    permission,
    function ({ session }: ListAccessArgs) {
      return (
        (session?.data.permissions
          ?.map((role: any) => role[permission])
          .filter((p: any) => !!p).length ?? 0) > 0
      );
    },
  ]),
);

// ---------- Permissions object ----------

export const permissions = {
  ...generatedPermissions,
};

// ---------- UI rules (Admin UI field modes) ----------

export const rules = {
  // Admin UI: who can edit things in the Keystone UI
  canEditAdminUI({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return "hidden";

    if (permissions.canManageUsers({ session })) return "edit";

    return "hidden";
  },

  // Admin UI: who can read things in the Keystone UI
  canReadAdminUI({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return "hidden";

    if (permissions.canManageUsers({ session })) return "read";

    return "hidden";
  },

  // ---------- Profile-related ----------

  // For list-level access.filter on Profile (query)
  // - Admins: all profiles
  // - Others: own profile and public profiles
  canReadProfiles({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (isAdmin({ session })) return true;

    return {
      OR: [{ id: { equals: session!.itemId } }, { isPublic: { equals: true } }],
    };
  },

  // ---------- Study ----------

  // For Study access.filter/update/delete
  // - Admins: all studies
  // - Others: author or collaborator
  canManageOwnStudies({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (isAdmin({ session })) return true;

    return {
      OR: [
        { author: { id: { equals: session!.itemId } } },
        { collaborators: { some: { id: { equals: session!.itemId } } } },
      ],
    };
  },

  // ---------- Class ----------

  // - Admins: all classes
  // - Others: creator only
  canManageOwnClasses({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (isAdmin({ session })) return true;

    return {
      creator: { id: { equals: session!.itemId } },
    };
  },

  // ---------- Task ----------

  // - Admins: all tasks
  // - Others: author or collaborator
  canManageOwnTasks({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (isAdmin({ session })) return true;

    return {
      OR: [
        { author: { id: { equals: session!.itemId } } },
        { collaborators: { some: { id: { equals: session!.itemId } } } },
      ],
    };
  },

  // ---------- Dataset ----------

  // - Admins: all datasets
  // - Others: datasets linked to their Profile
  canReadOwnDatasets({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (isAdmin({ session })) return true;

    return {
      OR: [{ profile: { id: { equals: session!.itemId } } }],
    };
  },

  // ---------- SummaryResult ----------

  // - Admins: all summary results
  // - Others: results linked to their Profile
  canReadOwnSummaryResults({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (isAdmin({ session })) return true;

    return {
      OR: [{ user: { id: { equals: session!.itemId } } }],
    };
  },

  // ---------- Update ----------

  // - Admins: all updates
  // - Others: updates linked to their Profile
  canReadOwnUpdates({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (isAdmin({ session })) return true;

    return {
      user: { id: { equals: session!.itemId } },
    };
  },

  // ---------- Existing rules you already had ----------

  canManageUsers({ session, item, context }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;

    if (permissions.canManageUsers({ session })) {
      return true;
    }

    if (item?.id === session?.itemId) {
      return true;
    }

    if (
      context?.req?.body?.operationName === "FOLLOW_USER_MUTATION" ||
      context?.req?.body?.operationName === "UNFOLLOW_USER_MUTATION"
    ) {
      return true;
    }

    return false;
  },

  canManageStudies({ session, item }: ListAccessArgs & { item?: any }) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageStudies({ session })) return true;
    if (item?.fromId === session?.itemId || item?.toId === session?.itemId) {
      return true;
    }
    return false;
  },

  canManageUserImages({ session, item }: ListAccessArgs & { item?: any }) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUserImages({ session })) return true;
    if (item?.userId === session?.itemId) return true;
    return false;
  },

  canManageRoles({ session }: ListAccessArgs) {
    if (isSuperAdmin({ session })) return true;
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageRoles({ session })) return true;
    return false;
  },

  canManageTemplates({ session, item }: ListAccessArgs & { item?: any }) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageTemplates({ session })) return true;
    if (item?.author === session?.itemId) return true;
    return false;
  },

  canManageTasks({ session, item }: ListAccessArgs & { item?: any }) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageTasks({ session })) return true;
    if (item?.author === session?.itemId) return true;
    return false;
  },

  canManageProjects({ session, item }: ListAccessArgs & { item?: any }) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageProjects({ session })) return true;
    if (item?.author === session?.itemId) return true;
    return false;
  },

  canManageJournals({ session, item }: ListAccessArgs & { item?: any }) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageJournals({ session })) return true;
    if (item?.authorId === session?.itemId) return true;
    return false;
  },
};
