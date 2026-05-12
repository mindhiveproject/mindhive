import { useEffect, useRef } from "react";
import useDatasourceData from "./useDatasourceData";

export default function DatasourceDataLoader({
  datasource,
  user,
  onDataReady,
}) {
  const { data, variables, settings, loading, error } = useDatasourceData({
    datasource,
    user,
  });

  const warnedEmptyIdRef = useRef(null);

  useEffect(() => {
    if (loading || error) return;

    const rowData = Array.isArray(data) ? data : [];
    const varList = Array.isArray(variables) ? variables : [];
    const safeSettings =
      settings && typeof settings === "object" ? settings : {};

    const isEmpty = rowData.length === 0 && varList.length === 0;
    if (isEmpty && datasource?.id && warnedEmptyIdRef.current !== datasource.id) {
      warnedEmptyIdRef.current = datasource.id;
      console.warn(
        "[DataJournal] Linked datasource has no rows or variables yet",
        { id: datasource.id, title: datasource.title },
      );
    } else if (!isEmpty) {
      warnedEmptyIdRef.current = null;
    }

    onDataReady({
      datasourceId: datasource?.id,
      data: rowData,
      variables: varList,
      settings: safeSettings,
    });
  }, [data, variables, settings, loading, error, datasource, onDataReady]);

  return null;
}
