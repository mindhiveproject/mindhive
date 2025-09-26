// New file: components/DataJournal/DatasourceDataLoader.js
import { useEffect } from "react";
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

  useEffect(() => {
    if (!loading && !error && data?.length) {
      const prefix = datasource?.title
        ? `${datasource.title}_`
        : `${datasource.id}_`;
      onDataReady({ data, variables, settings, prefix });
    }
  }, [data, variables, settings, loading, error, datasource, onDataReady]);

  return null;
}
