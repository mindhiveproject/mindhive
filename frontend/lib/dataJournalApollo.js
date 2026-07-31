import { GET_DATA_JOURNALS } from "../components/Queries/DataArea";
import { GET_DATA_JOURNAL } from "../components/Queries/DataJournal";
import { GET_DATASOURCES } from "../components/Queries/Datasource";
import { buildDatasourcesWhere } from "./dataJournalDatasources";

/**
 * @param {string | null | undefined} projectId
 * @param {string | null | undefined} studyId
 * @returns {Record<string, unknown> | null}
 */
export function buildVizJournalsWhere(projectId, studyId) {
  if (projectId && studyId) {
    return {
      OR: [
        { project: { id: { equals: projectId } } },
        { study: { id: { equals: studyId } } },
      ],
    };
  }
  if (projectId) return { project: { id: { equals: projectId } } };
  if (studyId) return { study: { id: { equals: studyId } } };
  return null;
}

/**
 * @param {string | null | undefined} projectId
 * @param {string | null | undefined} studyId
 * @returns {{ query: import("@apollo/client").DocumentNode, variables: { where: Record<string, unknown> | null } } | null}
 */
export function getJournalListRefetchQuery(projectId, studyId) {
  const where = buildVizJournalsWhere(projectId, studyId);
  if (!where) return null;
  return {
    query: GET_DATA_JOURNALS,
    variables: { where },
  };
}

/**
 * @param {string | null | undefined} journalId
 * @returns {{ query: import("@apollo/client").DocumentNode, variables: { id: string } } | null}
 */
export function getJournalDetailRefetchQuery(journalId) {
  if (!journalId) return null;
  return {
    query: GET_DATA_JOURNAL,
    variables: { id: journalId },
  };
}

/**
 * Broad datasource list used by Manage datasets modal.
 * @param {{ projectId?: string | null, studyId?: string | null, userId?: string | null }} params
 * @returns {{ query: import("@apollo/client").DocumentNode, variables: { where: Record<string, unknown> } } | null}
 */
export function getDatasourcesRefetchQuery({ projectId, studyId, userId }) {
  const where = buildDatasourcesWhere({ projectId, studyId, userId });
  if (!where) return null;
  return {
    query: GET_DATASOURCES,
    variables: { where },
  };
}

/** @typedef {"journalsList" | "activeJournal" | "datasourcesLibrary"} DataJournalInvalidationInclude */

/**
 * @param {{
 *   projectId?: string | null,
 *   studyId?: string | null,
 *   journalId?: string | null,
 *   userId?: string | null,
 *   include?: DataJournalInvalidationInclude[],
 * }} params
 * @returns {Array<{ query: import("@apollo/client").DocumentNode, variables?: Record<string, unknown> }>}
 */
export function getDataJournalInvalidationSet({
  projectId,
  studyId,
  journalId,
  userId,
  include = ["journalsList", "activeJournal", "datasourcesLibrary"],
}) {
  /** @type {Array<{ query: import("@apollo/client").DocumentNode, variables?: Record<string, unknown> }>} */
  const queries = [];

  if (include.includes("journalsList")) {
    const listQuery = getJournalListRefetchQuery(projectId, studyId);
    if (listQuery) queries.push(listQuery);
  }

  if (include.includes("activeJournal")) {
    const detailQuery = getJournalDetailRefetchQuery(journalId);
    if (detailQuery) queries.push(detailQuery);
  }

  if (include.includes("datasourcesLibrary")) {
    const dsQuery = getDatasourcesRefetchQuery({ projectId, studyId, userId });
    if (dsQuery) queries.push(dsQuery);
  }

  return queries;
}

/**
 * Compare journal list rows for datasource attachment changes.
 * @param {object | null | undefined} a
 * @param {object | null | undefined} b
 * @returns {boolean}
 */
export function journalDatasourcesSnapshotEqual(a, b) {
  if (!a || !b) return a === b;
  if (a.id !== b.id) return false;
  const idsA = (a.datasources || [])
    .map((d) => d?.id)
    .filter(Boolean)
    .sort()
    .join(",");
  const idsB = (b.datasources || [])
    .map((d) => d?.id)
    .filter(Boolean)
    .sort()
    .join(",");
  if (idsA !== idsB) return false;
  if (a.title !== b.title) return false;
  if (a.updatedAt !== b.updatedAt) return false;
  return true;
}
