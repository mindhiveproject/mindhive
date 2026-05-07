/**
 * Data Journal datasource list filters and delete eligibility helpers.
 */

/**
 * @param {{ projectId?: string | null, studyId?: string | null, userId?: string | null }} params
 * @returns {Record<string, unknown> | null}
 */
export function buildDatasourcesWhere({ projectId, studyId, userId }) {
  const or = [];

  if (projectId && studyId) {
    or.push({ project: { id: { equals: projectId } } });
    or.push({ study: { id: { equals: studyId } } });
  } else if (projectId) {
    or.push({ project: { id: { equals: projectId } } });
  } else if (studyId) {
    or.push({ study: { id: { equals: studyId } } });
  }

  const vizJournalScope = [];
  if (projectId) {
    vizJournalScope.push({ project: { id: { equals: projectId } } });
  }
  if (studyId) {
    vizJournalScope.push({ study: { id: { equals: studyId } } });
  }
  if (vizJournalScope.length > 0) {
    or.push({
      journal: {
        some: {
          vizJournal: {
            OR: vizJournalScope,
          },
        },
      },
    });
  }

  if (userId) {
    or.push({ author: { id: { equals: userId } } });
  }

  or.push({
    journal: {
      some: {
        AND: [
          { isPublic: { equals: true } },
          { isTemplate: { equals: true } },
        ],
      },
    },
  });

  if (or.length === 0) return null;
  if (or.length === 1) return or[0];
  return { OR: or };
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
 * @param {{ collaboratorsCanEdit?: boolean | null, collaborators?: Array<{ id?: string | null }> | null, author?: { id?: string | null } | null }} datasource
 * @param {string | undefined | null} userId
 */
export function isDatasourceEditableCollaborator(datasource, userId) {
  if (!userId || !datasource?.collaboratorsCanEdit) return false;
  return (datasource?.collaborators || []).some((c) => c?.id === userId);
}

/**
 * @param {object} datasource
 * @param {{ userId?: string | null, currentVizPartId?: string | null }} context
 * @returns {"editable" | "copyOnWrite" | "readOnly"}
 */
export function getDatasourceWriteMode(datasource, context) {
  const { userId, currentVizPartId } = context || {};
  if (!userId) return "readOnly";
  if (datasource?.author?.id === userId) return "editable";
  if (isDatasourceEditableCollaborator(datasource, userId)) return "editable";
  if (currentVizPartId) return "copyOnWrite";
  return "readOnly";
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
 * @returns {"workspace" | "viaPart" | "yourLibrary" | "other"}
 */
export function getDatasourceListInclusionKind(datasource, context) {
  const { projectId, studyId, userId } = context || {};
  const pid = datasource?.project?.id;
  const sid = datasource?.study?.id;
  const inWorkspace =
    (projectId != null && projectId !== "" && pid === projectId) ||
    (studyId != null && studyId !== "" && sid === studyId);

  if (inWorkspace) return "workspace";

  const journalCount = datasource?.journal?.length ?? 0;
  if (journalCount > 0) return "viaPart";

  if (userId && datasource?.author?.id === userId) return "yourLibrary";

  return "other";
}
