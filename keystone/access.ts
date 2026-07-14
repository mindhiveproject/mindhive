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
  // ClassNetwork: creators and explicitly assigned network admins manage
  // network metadata/membership. Global user managers keep full override.
  classNetworkMutate({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session.itemId;
    return {
      OR: [
        { creator: { id: { equals: me } } },
        { admins: { some: { id: { equals: me } } } },
      ],
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
  // OpportunityReviewNote query: visible to the author, any reviewer on
  // the same round, the round creator, class-network admins/class teachers,
  // the opportunity's mentor, or admins.
  connectReviewNoteVisible({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session.itemId;
    return {
      OR: [
        { author: { id: { equals: me } } },
        { round: { createdBy: { id: { equals: me } } } },
        { round: { reviewers: { some: { id: { equals: me } } } } },
        { round: { classNetwork: { creator: { id: { equals: me } } } } },
        { round: { classNetwork: { admins: { some: { id: { equals: me } } } } } },
        {
          round: {
            classNetwork: {
              classes: { some: { creator: { id: { equals: me } } } },
            },
          },
        },
        { opportunity: { mentor: { id: { equals: me } } } },
      ],
    };
  },
  // OpportunityReviewNote mutate: only the author or an admin can edit
  // or delete a note. Reviewers can leave their own notes (the create
  // operation is gated separately via the round-reviewer check at the
  // application layer; here we just stop users from editing other
  // reviewers' notes).
  connectReviewNoteMutate({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    const me = session.itemId;
    return {
      author: { id: { equals: me } },
    };
  },
  // Connect customizable forms — FormDefinition mutate.
  // Admins (canManageUsers) can manage any definition. Users with
  // canManageForms can manage scope=organization definitions for orgs
  // they are members of. Class creators can manage scope=project_board
  // definitions on their template boards (inline milestone form builder).
  formDefinitionMutate({ session }: ListAccessArgs) {
    return formDefinitionMutateFilter(session);
  },
  // FormCard mutate inherits the same rule via the parent definition.
  formCardMutate({ session }: ListAccessArgs) {
    const filter = formDefinitionMutateFilter(session);
    if (filter === true || filter === false) return filter;
    return {
      OR: filter.OR.map((clause: Record<string, unknown>) => ({
        definition: clause,
      })),
    };
  },
  // FormField mutate inherits via card.definition.
  formFieldMutate({ session }: ListAccessArgs) {
    const filter = formDefinitionMutateFilter(session);
    if (filter === true || filter === false) return filter;
    return {
      OR: filter.OR.map((clause: Record<string, unknown>) => ({
        card: { definition: clause },
      })),
    };
  },
  async formCardCreate({ session, context, inputData }: ListAccessArgs) {
    return canCreateFormCard({ session, context, inputData });
  },
  async formFieldCreate({ session, context, inputData }: ListAccessArgs) {
    return canCreateFormField({ session, context, inputData });
  },
  // Template-scoped milestones: admins, canManageForms, or class creators
  // whose class uses the linked template board.
  milestoneMutate({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;
    if (permissions.canManageForms({ session })) return true;
    const me = session.itemId;
    return {
      scope: { equals: "template" },
      templateBoard: templateBoardCreatorFilter(me),
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

const FORM_DEFINITION_ACCESS_QUERY = `
  id
  scope
  organization { members { id } }
  proposalBoard {
    templateForClasses { creator { id } }
    templatesForClass { creator { id } }
  }
`;

function templateBoardCreatorFilter(me: string) {
  return {
    OR: [
      {
        templateForClasses: {
          some: { creator: { id: { equals: me } } },
        },
      },
      {
        templatesForClass: {
          some: { creator: { id: { equals: me } } },
        },
      },
    ],
  };
}

function projectBoardFormScopeFilter(me: string) {
  return {
    scope: { equals: "project_board" },
    proposalBoard: templateBoardCreatorFilter(me),
  };
}

function organizationFormScopeFilter(me: string) {
  return {
    scope: { equals: "organization" },
    organization: { members: { some: { id: { equals: me } } } },
  };
}

function formDefinitionMutateFilter(session?: ListAccessArgs["session"]) {
  if (!isSignedIn({ session })) return false;
  if (permissions.canManageUsers({ session })) return true;
  const me = session!.itemId;
  const orFilters: Record<string, unknown>[] = [
    projectBoardFormScopeFilter(me),
  ];
  if (permissions.canManageForms({ session })) {
    orFilters.unshift(organizationFormScopeFilter(me));
  }
  return { OR: orFilters };
}

export function canMutateFormDefinition(
  session: ListAccessArgs["session"],
  definition: {
    scope?: string | null;
    organization?: { members?: { id?: string | null }[] | null } | null;
    proposalBoard?: {
      templateForClasses?: { creator?: { id?: string | null } | null }[] | null;
      templatesForClass?: { creator?: { id?: string | null } | null }[] | null;
    } | null;
  } | null
) {
  if (!session?.itemId || !definition) return false;
  if (permissions.canManageUsers({ session })) return true;
  const me = session.itemId;
  if (
    definition.scope === "organization" &&
    permissions.canManageForms({ session })
  ) {
    return (definition.organization?.members || []).some(
      (member) => member?.id === me
    );
  }
  if (definition.scope === "project_board") {
    const classes = [
      ...(definition.proposalBoard?.templateForClasses || []),
      ...(definition.proposalBoard?.templatesForClass || []),
    ];
    return classes.some((klass) => klass?.creator?.id === me);
  }
  return false;
}

async function canCreateFormCard({
  session,
  context,
  inputData,
}: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (permissions.canManageUsers({ session })) return true;
  const definitionId = inputData?.definition?.connect?.id;
  if (!definitionId || !context) {
    return !!permissions.canManageForms({ session });
  }
  const definition = await context.query.FormDefinition.findOne({
    where: { id: definitionId },
    query: FORM_DEFINITION_ACCESS_QUERY,
  });
  return canMutateFormDefinition(session, definition);
}

async function canCreateFormField({
  session,
  context,
  inputData,
}: ListAccessArgs) {
  if (!session?.itemId) return false;
  if (permissions.canManageUsers({ session })) return true;
  const cardId = inputData?.card?.connect?.id;
  if (!cardId || !context) {
    return !!permissions.canManageForms({ session });
  }
  const card = await context.query.FormCard.findOne({
    where: { id: cardId },
    query: `definition { ${FORM_DEFINITION_ACCESS_QUERY} }`,
  });
  return canMutateFormDefinition(session, card?.definition);
}
