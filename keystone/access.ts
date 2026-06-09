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
      return (
        session?.data.permissions
          ?.map((role) => role[permission])
          .filter((p) => !!p).length > 0
      );
    },
  ])
);

// Permissions check if someone meets a criteria - yes or no
// Issue #7: removed hardcoded `isAwesome` username bypass; use the
// canAccessAdminUI permission flag stored on the user's Role instead.
export const permissions = {
  ...generatedPermissions,
};

// Rule based functions
// rules can return a boolean or a filter that limits which products they can CRUD
export const rules = {
  canEditAdminUI({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return "hidden";
    }
    if (permissions.canAccessAdminUI({ session })) {
      return "edit";
    }
    if (permissions.canManageUsers({ session })) {
      return "edit";
    }
    return "hidden";
  },
  canReadAdminUI({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return "hidden";
    }
    if (permissions.canAccessAdminUI({ session })) {
      return "read";
    }
    if (permissions.canManageUsers({ session })) {
      return "read";
    }
    return "hidden";
  },
  // Issue #8: removed the spoofable operationName bypass.
  // Follow/unfollow operations must go through dedicated custom mutations
  // that update only the relevant relationship fields on their own.
  canManageUsers({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the admin permission
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    // 2. Otherwise, they may only update themselves
    if (item?.id === session?.itemId) {
      return true;
    }
    return false;
  },
  // Issue #9: added explicit `return false` on all non-matching branches.
  // Also replaced non-existent permission function calls (e.g. canManagePosts,
  // canManageCollections) with canManageUsers — the only admin flag that exists
  // in permissionsList and is actually evaluated.
  canManagePosts({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.authorId === session.itemId) {
      return true;
    }
    return false;
  },
  canManageCollections({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.ownerId === session.itemId) {
      return true;
    }
    return false;
  },
  canManageContracts({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (
      item.customerId === session.itemId ||
      item.supplierId === session.itemId
    ) {
      return true;
    }
    return false;
  },
  canManageProposals({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.fromId === session.itemId || item.toId === session.itemId) {
      return true;
    }
    return false;
  },
  canManagePriceBids({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.fromId === session.itemId || item.toId === session.itemId) {
      return true;
    }
    return false;
  },
  canManageTransactions({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.fromId === session.itemId || item.toId === session.itemId) {
      return true;
    }
    return false;
  },
  canManageUserImages({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.userId === session.itemId) {
      return true;
    }
    return false;
  },
  canManageRoles({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canAccessAdminUI({ session })) {
      return true;
    }
    return false;
  },
  canManageTemplates({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.author === session.itemId) {
      return true;
    }
    return false;
  },
  canManageTasks({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.author === session.itemId) {
      return true;
    }
    return false;
  },
  canManageProjects({ session, item }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    if (item.author === session.itemId) {
      return true;
    }
    return false;
  },
  // Connect: a profile's own preference / answers / team prefs are visible to:
  // - themselves
  // - the creator of the round (teacher)
  // - admins
  // Returns a filter, NOT a boolean — used as `access.filter.query`.
  connectOwnerOrRoundCreator({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session.itemId;
    return {
      OR: [
        { submitter: { id: { equals: me } } },
        { round: { createdBy: { id: { equals: me } } } },
      ],
    };
  },
  // QuestionAnswer uses `respondent`, not `submitter`.
  connectAnswerVisible({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session.itemId;
    return {
      OR: [
        { respondent: { id: { equals: me } } },
        { round: { createdBy: { id: { equals: me } } } },
      ],
    };
  },
  // ConnectMatch visible to: the matched student, the opportunity's mentor,
  // the round creator, or admins.
  connectMatchVisible({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session.itemId;
    return {
      OR: [
        { student: { id: { equals: me } } },
        { round: { createdBy: { id: { equals: me } } } },
        { opportunity: { mentor: { id: { equals: me } } } },
      ],
    };
  },
  // ConnectRating: rater, opportunity mentor, round creator (via match.round),
  // or a public rating — visible to anyone signed in.
  connectRatingVisible({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session.itemId;
    return {
      OR: [
        { rater: { id: { equals: me } } },
        { isPublic: { equals: true } },
        { opportunity: { mentor: { id: { equals: me } } } },
        { match: { round: { createdBy: { id: { equals: me } } } } },
      ],
    };
  },
  // Organization: only members (and admins) can update or delete.
  // Read access stays open — anyone can browse organizations.
  connectOrganizationMutate({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session.itemId;
    return {
      members: { some: { id: { equals: me } } },
    };
  },
  // ConnectPreferenceItem inherits from its parent preference's submitter / round creator.
  connectPreferenceItemVisible({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session.itemId;
    return {
      OR: [
        { preference: { submitter: { id: { equals: me } } } },
        { preference: { round: { createdBy: { id: { equals: me } } } } },
      ],
    };
  },
  // For mutate operations on the above lists: only the owner or admin.
  // The relevant owner-field name is passed via closure.
  connectOwnerMutate(ownerField: string) {
    return function ({ session, item }: ListAccessArgs) {
      if (!isSignedIn({ session })) return false;
      if (permissions.canManageUsers({ session })) return true;
      // item access fires per item; ownerField is e.g. "submitterId" / "respondentId" / "raterId" / "studentId"
      if (item && item[ownerField] === session.itemId) return true;
      return false;
    };
  },
};
