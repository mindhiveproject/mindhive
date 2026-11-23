/**
 * Data Journal datasource list filters and delete eligibility helpers.
 */

/** @typedef {"me" | "uploaded" | "sharedWithMe" | "myClass" | "classNetwork" | "public" | "simulated"} DatasetScope */

/** Roles that may create and see SIMULATED datasets (mirrors the Keystone Datasource access filter). */
const SIMULATED_DATASET_ROLES = ["TESTER", "ADMIN"];

/**
 * @param {{ permissions?: Array<{ name?: string | null }> | null } | null | undefined} user
 */
export function isTesterUser(user) {
  return (user?.permissions || []).some((p) =>
    SIMULATED_DATASET_ROLES.includes(p?.name),
  );
}

/** Library tabs after "me" (everything the user can see). "classNetwork" is shown to testers only. */
/** @type {Exclude<DatasetScope, "me">[]} */
export const DATASET_ATOMIC_SCOPES = [
  "uploaded",
  "sharedWithMe",
  "myClass",
  "classNetwork",
  "public",
];

/** @type {DatasetScope[]} */
export const DATASET_SCOPES = ["me", ...DATASET_ATOMIC_SCOPES];

/** Tabs only testers see: simulated data, and class network (under construction). */
export const TESTER_ONLY_DATASET_SCOPES = ["classNetwork", "simulated"];

/**
 * Library tabs for this user, in display order.
 * @param {{ permissions?: Array<{ name?: string | null }> | null } | null | undefined} user
 * @returns {DatasetScope[]}
 */
export function visibleDatasetScopes(user) {
  const tester = isTesterUser(user);
  const scopes = [...DATASET_SCOPES, "simulated"];
  return tester
    ? scopes
    : scopes.filter((scope) => !TESTER_ONLY_DATASET_SCOPES.includes(scope));
}

/**
 * Newest-first by `updatedAt`, falling back to `createdAt`.
 * @template {{ updatedAt?: string | null, createdAt?: string | null }} T
 * @param {T[] | null | undefined} datasources
 * @returns {T[]}
 */
export function sortDatasourcesByMostRecent(datasources) {
  return [...(datasources || [])].sort((a, b) => {
    const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
    const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

/**
 * @param {string[]} classIds
 * @returns {Record<string, unknown> | null}
 */
function studyOrProjectInClassesWhere(classIds) {
  if (!classIds?.length) return null;
  return {
    OR: [
      { study: { classes: { some: { id: { in: classIds } } } } },
      { project: { usedInClass: { id: { in: classIds } } } },
      {
        project: {
          templateForClasses: { some: { id: { in: classIds } } },
        },
      },
    ],
  };
}

/**
 * @param {{ projectId?: string | null, studyId?: string | null }} params
 * @returns {Record<string, unknown> | null}
 */
function attachedToCurrentContextWhere({ projectId, studyId }) {
  const or = [];
  if (projectId) or.push({ project: { id: { equals: projectId } } });
  if (studyId) or.push({ study: { id: { equals: studyId } } });
  if (or.length === 0) return null;
  if (or.length === 1) return or[0];
  return { OR: or };
}

/**
 * Datasets reached through a study or project board `userId` works on (author
 * or collaborator of the study, or of a board linked to it). A display
 * grouping only: the server decides what is readable
 * (keystone/lib/datasourceAccess.js).
 * @param {string} userId
 */
function studyOrBoardTeamWhere(userId) {
  const team = {
    OR: [
      { author: { id: { equals: userId } } },
      { collaborators: { some: { id: { equals: userId } } } },
    ],
  };
  return {
    OR: [
      {
        study: {
          OR: [...team.OR, { proposal: { some: team } }],
        },
      },
      { project: team },
    ],
  };
}

/**
 * Where-clause for one dataset library tab. The server already limits every
 * query to the datasets the user may read (public, shared with their class,
 * or theirs through authorship, a study or a board), so these clauses only
 * group that set into tabs.
 *
 * @param {{
 *   scope: DatasetScope,
 *   projectId?: string | null,
 *   studyId?: string | null,
 *   userId?: string | null,
 *   directClassIds?: string[],
 *   networkClassIds?: string[],
 * }} params
 * @returns {Record<string, unknown>}
 */
export function buildDatasourcesWhereForScope({
  scope,
  projectId,
  studyId,
  userId,
  directClassIds = [],
  networkClassIds = [],
}) {
  switch (scope) {
    case "me":
      // everything the server lets this user read
      return {};

    case "uploaded":
      if (!userId) return { id: { equals: "__no_matching_user__" } };
      return {
        AND: [
          { author: { id: { equals: userId } } },
          { dataOrigin: { equals: "UPLOADED" } },
          // copies (of a teacher's or a template's dataset) sit under "Me"
          { isCopy: { equals: false } },
        ],
      };

    case "sharedWithMe":
      if (!userId) return { id: { equals: "__no_matching_user__" } };
      return {
        AND: [
          { author: { id: { not: { equals: userId } } } },
          studyOrBoardTeamWhere(userId),
        ],
      };

    case "myClass":
      // only what a teacher explicitly shared with one of the user's classes
      if (!directClassIds.length) {
        return { id: { equals: "__no_matching_classes__" } };
      }
      return {
        sharedWithClasses: { some: { id: { in: directClassIds } } },
      };

    case "classNetwork": {
      // testers only, under construction
      const contextFilter = attachedToCurrentContextWhere({ projectId, studyId });
      const networkFilter = studyOrProjectInClassesWhere(networkClassIds);
      if (!contextFilter || !networkFilter) {
        return { id: { equals: "__no_matching_class_network__" } };
      }
      return { AND: [contextFilter, networkFilter] };
    }

    case "simulated":
      return { dataOrigin: { equals: "SIMULATED" } };

    case "public":
      return { isPublic: { equals: true } };

    default:
      return {};
  }
}

/**
 * Class ids linked to a datasource via its study / project (when those relations are loaded).
 * @param {{
 *   study?: { classes?: Array<{ id?: string | null }> | null } | null,
 *   project?: {
 *     usedInClass?: { id?: string | null } | null,
 *     templateForClasses?: Array<{ id?: string | null }> | null,
 *   } | null,
 * }} datasource
 * @returns {string[]}
 */
export function collectDatasourceLinkedClassIds(datasource) {
  const ids = new Set();
  (datasource?.study?.classes || []).forEach((c) => {
    if (c?.id) ids.add(c.id);
  });
  if (datasource?.project?.usedInClass?.id) {
    ids.add(datasource.project.usedInClass.id);
  }
  (datasource?.project?.templateForClasses || []).forEach((c) => {
    if (c?.id) ids.add(c.id);
  });
  return [...ids];
}

/**
 * Which atomic scopes explain why this datasource is visible to the current user
 * (uploaded, shared with me, my class, class network, and/or public).
 * Mirrors {@link buildDatasourcesWhereForScope} with `"me"` using list-query fields.
 *
 * @param {{
 *   dataOrigin?: string | null,
 *   author?: { id?: string | null } | null,
 *   collaborators?: Array<{ id?: string | null }> | null,
 *   project?: { id?: string | null, usedInClass?: { id?: string | null } | null, templateForClasses?: Array<{ id?: string | null }> | null } | null,
 *   study?: { id?: string | null, classes?: Array<{ id?: string | null }> | null } | null,
 *   isPublic?: boolean | null,
 *   sharedWithClasses?: Array<{ id?: string | null }> | null,
 * }} datasource
 * @param {{
 *   userId?: string | null,
 *   projectId?: string | null,
 *   studyId?: string | null,
 *   directClassIds?: string[],
 *   networkClassIds?: string[],
 * }} context
 * @returns {Exclude<DatasetScope, "me">[]}
 */
export function getDatasourceVisibilityScopes(datasource, context) {
  const {
    userId,
    projectId,
    studyId,
    directClassIds = [],
    networkClassIds = [],
  } = context || {};

  /** @type {Exclude<DatasetScope, "me">[]} */
  const matched = [];

  if (
    userId &&
    datasource?.author?.id === userId &&
    datasource?.dataOrigin === "UPLOADED" &&
    !datasource?.isCopy
  ) {
    matched.push("uploaded");
  }

  const sharedClassIds = (datasource?.sharedWithClasses || [])
    .map((c) => c?.id)
    .filter(Boolean);
  if (
    directClassIds.length > 0 &&
    sharedClassIds.some((id) => directClassIds.includes(id))
  ) {
    matched.push("myClass");
  }

  const linkedClassIds = collectDatasourceLinkedClassIds(datasource);

  const inCurrentContext =
    (projectId != null &&
      projectId !== "" &&
      datasource?.project?.id === projectId) ||
    (studyId != null && studyId !== "" && datasource?.study?.id === studyId);
  if (
    inCurrentContext &&
    networkClassIds.length > 0 &&
    linkedClassIds.some((id) => networkClassIds.includes(id))
  ) {
    matched.push("classNetwork");
  }

  if (datasource?.isPublic) {
    matched.push("public");
  }

  return matched;
}

/**
 * Datasource list for the journal attach window: the same set as the
 * library's "me" tab, i.e. everything the server lets the user read.
 * @returns {Record<string, unknown>}
 */
export function buildDatasourcesWhere() {
  return buildDatasourcesWhereForScope({ scope: "me" });
}

/**
 * @param {{ journal?: Array<{ isPublic?: boolean | null, isTemplate?: boolean | null }> | null }} datasource
 */
export function isDatasourceLockedFromPublicTemplate(datasource) {
  const journals = datasource?.journal || [];
  return journals.some((j) => j?.isPublic && j?.isTemplate);
}

/**
 * @param {{ journal?: unknown, author?: { id?: string | null } | null }} datasource
 * @param {string | undefined | null} userId
 * @returns {"publicTemplate" | "notOwner" | null}
 */
export function getDatasourceDeleteDisabledReason(datasource, userId) {
  if (isDatasourceLockedFromPublicTemplate(datasource)) return "publicTemplate";
  if (!userId || !datasource?.author?.id || datasource.author.id !== userId) {
    return "notOwner";
  }
  return null;
}

/**
 * Delete is blocked if the dataset is tied to a public template part, or the viewer is not the author.
 */
export function isDatasourceDeleteDisabled(datasource, userId) {
  return getDatasourceDeleteDisabledReason(datasource, userId) != null;
}

/**
 * A live dataset reads its rows from a study as they come in (study and
 * template origins); everything else is a static file. Only static datasets
 * can be copied with a template journal for now: a copy cannot keep a live
 * link to a study its maker does not work on.
 * @param {{ dataOrigin?: string | null } | null | undefined} datasource
 */
export function isLiveDatasource(datasource) {
  return (
    datasource?.dataOrigin === "STUDY" || datasource?.dataOrigin === "TEMPLATE"
  );
}

/**
 * Who reaches a dataset besides classes and public (keystone/lib/
 * datasourceAccess.js): "team" when the people on its study or project board
 * can read it; otherwise "collaborators" when its author named some; otherwise
 * "private" (its author alone — a fresh copy, or nothing to share with).
 * @param {{ sharedWithTeam?: boolean | null, study?: { id?: string | null } | null, project?: { id?: string | null } | null, collaborators?: unknown[] | null } | null | undefined} datasource
 * @returns {"team" | "collaborators" | "private"}
 */
export function getDatasourceTeamAudience(datasource) {
  if (
    datasource?.sharedWithTeam !== false &&
    (datasource?.study?.id || datasource?.project?.id)
  ) {
    return "team";
  }
  if ((datasource?.collaborators || []).length > 0) return "collaborators";
  return "private";
}

/**
 * @param {{ collaboratorsCanEdit?: boolean | null, collaborators?: Array<{ id?: string | null }> | null, author?: { id?: string | null } | null }} datasource
 * @param {string | undefined | null} userId
 */
export function isDatasourceEditableCollaborator(datasource, userId) {
  if (!userId || !datasource?.collaboratorsCanEdit) return false;
  return (datasource?.collaborators || []).some((c) => c?.id === userId);
}

/**
 * @param {object} datasource
 * @param {{ userId?: string | null }} context
 * @returns {"editable" | "copyOnWrite" | "readOnly"}
 */
export function getDatasourceWriteMode(datasource, context) {
  const { userId } = context || {};
  if (!userId) return "readOnly";
  if (datasource?.author?.id === userId) return "editable";
  // Collaborators edit in place, shared dataset or not (they may still make a
  // copy); everyone else edits a copy (mirrors the Datasource update rule).
  if (isDatasourceEditableCollaborator(datasource, userId)) return "editable";
  // Anyone else signed in edits a copy of their own, journal or not: a copy
  // is attached to a journal only when the board has exactly one.
  return "copyOnWrite";
}

/**
 * Only the dataset author may rename (title).
 */
export function canRenameDatasource(datasource, userId) {
  return Boolean(userId && datasource?.author?.id === userId);
}

/**
 * Attach to a journal part: author or collaborator with edit rights.
 */
export function canAttachDatasourceToJournal(datasource, userId) {
  if (!userId) return false;
  if (datasource?.author?.id === userId) return true;
  return isDatasourceEditableCollaborator(datasource, userId);
}

/**
 * Collect profile ids to share with from study + project (for client-side create payload).
 * @param {{ author?: { id?: string | null } | null, collaborators?: Array<{ id?: string | null }> | null } | null | undefined} study
 * @param {{ author?: { id?: string | null } | null, collaborators?: Array<{ id?: string | null }> | null } | null | undefined} project
 * @param {string | undefined | null} excludeUserId
 * @returns {string[]}
 */
export function collectSharingProfileIdsFromStudyAndProject(
  study,
  project,
  excludeUserId
) {
  const ids = new Set();
  if (study?.author?.id) ids.add(study.author.id);
  (study?.collaborators || []).forEach((c) => {
    if (c?.id) ids.add(c.id);
  });
  if (project?.author?.id) ids.add(project.author.id);
  (project?.collaborators || []).forEach((c) => {
    if (c?.id) ids.add(c.id);
  });
  if (excludeUserId) ids.delete(excludeUserId);
  return [...ids];
}

/**
 * Recipients for UI tooltips when creating a dataset (study + project author/collaborators).
 * @param {{ author?: { id?: string | null, username?: string | null } | null, collaborators?: Array<{ id?: string | null, username?: string | null }> | null } | null | undefined} study
 * @param {{ author?: { id?: string | null, username?: string | null } | null, collaborators?: Array<{ id?: string | null, username?: string | null }> | null } | null | undefined} project
 * @param {string | undefined | null} excludeUserId
 * @returns {Array<{ id: string, username: string, roles: string[] }>}
 */
export function getSharingRecipientEntries(study, project, excludeUserId) {
  /** @type {Map<string, { id: string, username: string, roles: string[] }>} */
  const byId = new Map();
  const add = (id, username, role) => {
    if (!id || (excludeUserId && id === excludeUserId)) return;
    const name = username || "";
    if (!byId.has(id)) {
      byId.set(id, { id, username: name, roles: [] });
    }
    const row = byId.get(id);
    if (row && !row.roles.includes(role)) {
      row.roles.push(role);
    }
  };

  if (study?.author?.id) {
    add(study.author.id, study.author.username, "studyAuthor");
  }
  (study?.collaborators || []).forEach((c) => {
    if (c?.id) add(c.id, c.username, "studyCollaborator");
  });
  if (project?.author?.id) {
    add(project.author.id, project.author.username, "projectAuthor");
  }
  (project?.collaborators || []).forEach((c) => {
    if (c?.id) add(c.id, c.username, "projectCollaborator");
  });

  return [...byId.values()];
}

/**
 * Why a datasource appears in the Data Journal list for the current context.
 * Mirrors the broad OR in {@link buildDatasourcesWhere} using fields available on the list query
 * (not a full re-evaluation of the GraphQL where clause).
 *
 * @param {{
 *   project?: { id?: string | null } | null,
 *   study?: { id?: string | null } | null,
 *   journal?: unknown[] | null,
 *   author?: { id?: string | null } | null,
 * }} datasource
 * @param {{ projectId?: string | null, studyId?: string | null, userId?: string | null }} context
 * @returns {"workspace" | "classShared" | "viaPart" | "yourLibrary" | "other"}
 */
export function getDatasourceListInclusionKind(datasource, context) {
  const { projectId, studyId, userId } = context || {};
  const pid = datasource?.project?.id;
  const sid = datasource?.study?.id;
  const inWorkspace =
    (projectId != null && projectId !== "" && pid === projectId) ||
    (studyId != null && studyId !== "" && sid === studyId);

  if (inWorkspace) return "workspace";

  if (
    (datasource?.sharedWithClasses?.length ?? 0) > 0 &&
    (!userId || datasource?.author?.id !== userId)
  ) {
    return "classShared";
  }

  const journalCount = datasource?.journal?.length ?? 0;
  if (journalCount > 0) return "viaPart";

  if (userId && datasource?.author?.id === userId) return "yourLibrary";

  return "other";
}
