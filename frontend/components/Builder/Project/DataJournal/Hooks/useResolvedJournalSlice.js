import { useMemo } from "react";

import { useDataJournal } from "../Context/DataJournalContext";
import { resolveDatasourceSourceSlice } from "../Helpers/resolveDatasourceSlice";

/**
 * @param {{ datasourceId?: string | null } | null | undefined} content
 */
export default function useResolvedJournalSlice(content) {
  const { journalDatasources, sourceDataByDatasourceId } = useDataJournal();

  return useMemo(
    () =>
      resolveDatasourceSourceSlice({
        content,
        journalDatasources,
        sourceDataByDatasourceId,
      }),
    [content, content?.datasourceId, journalDatasources, sourceDataByDatasourceId],
  );
}
