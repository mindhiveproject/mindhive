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
