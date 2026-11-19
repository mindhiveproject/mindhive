import { useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client";

import { GET_DATASOURCES } from "../../../../Queries/Datasource";
import { sortDatasourcesByMostRecent } from "../../../../../lib/dataJournalDatasources";

/** Datasets per "Show more" step. */
export const DATASOURCES_PAGE_SIZE = 24;

/**
 * GET_DATASOURCES variables for the first `pages` pages of `where`. "Show
 * more" grows `take` rather than merging pages, so refetching the query by
 * name (after a create, delete or share) refreshes everything on screen.
 * @param {Record<string, unknown>} where
 * @param {number} [pages]
 */
export function datasourcesPageVariables(where, pages = 1) {
  return { where, take: DATASOURCES_PAGE_SIZE * pages, skip: 0 };
}

/**
 * The datasets matching `where` the user may read, newest first, a page at a
 * time. Admins and busy teachers can read hundreds of datasets, so the list is
 * never loaded in one go.
 *
 * @param {{ where: Record<string, unknown>, skip?: boolean }} params
 */
export function usePagedDatasources({ where, skip = false }) {
  const whereKey = useMemo(() => JSON.stringify(where ?? {}), [where]);
  const [paging, setPaging] = useState({ whereKey, pages: 1 });
  const pages = paging.whereKey === whereKey ? paging.pages : 1;

  const { data, loading, error, refetch } = useQuery(GET_DATASOURCES, {
    variables: datasourcesPageVariables(where, pages),
    skip,
  });

  // Keep showing the rows already on screen while the next page loads
  // (new variables leave `data` empty until they arrive), but never another
  // filter's rows.
  const lastRef = useRef({ whereKey: null, data: null });
  if (data) lastRef.current = { whereKey, data };
  const shown =
    data || (lastRef.current.whereKey === whereKey ? lastRef.current.data : null);

  const datasources = useMemo(
    () => sortDatasourcesByMostRecent(shown?.datasources),
    [shown?.datasources],
  );
  const totalCount = shown?.datasourcesCount ?? datasources.length;

  return {
    datasources,
    totalCount,
    hasMore: datasources.length < totalCount,
    loading: loading && !shown,
    loadingMore: loading && !!shown,
    error,
    refetch,
    loadMore: () => setPaging({ whereKey, pages: pages + 1 }),
  };
}
