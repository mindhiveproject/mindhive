import { useState, useEffect, useMemo } from "react";

import { getDatasourceWriteMode } from "../../../../../../lib/dataJournalDatasources";
import { useDataJournal } from "../../Context/DataJournalContext";
import { StyledDatasetView } from "../../styles/StyledDatasetView";

import Menu from "./Menu";
import Table from "./Table";
import useDatasourceData from "../../DataLoader/useDatasourceData";

export default function DatasetView({ dataset, user, onSaved, onCopied }) {
  const { user: ctxUser, projectId, studyId, selectedJournal } =
    useDataJournal();
  const effectiveUser = user || ctxUser;
  const currentVizPartId = selectedJournal?.id ?? null;

  const writeMode = useMemo(
    () =>
      getDatasourceWriteMode(dataset, {
        userId: effectiveUser?.id,
        currentVizPartId,
      }),
    [dataset, effectiveUser?.id, currentVizPartId],
  );

  const {
    data: fetchedData,
    variables: fetchedVariables,
    settings: fetchedSettings,
    components: fetchedComponents = [],
    loading: fetchLoading,
    error: fetchError,
  } = useDatasourceData({ datasource: dataset, user: effectiveUser });

  const [data, setData] = useState([]);
  const [variables, setVariables] = useState([]);
  const [settings, setSettings] = useState({ filter: {} });
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (
      fetchedData != null &&
      fetchedVariables != null &&
      fetchedSettings != null
    ) {
      setData(fetchedData);
      setVariables(fetchedVariables);
      setSettings(fetchedSettings);
      setComponents(Array.isArray(fetchedComponents) ? fetchedComponents : []);
      setLoading(false);
    }
  }, [fetchedData, fetchedVariables, fetchedSettings, fetchedComponents]);

  useEffect(() => {
    if (fetchError) {
      setError(fetchError);
      setLoading(false);
    }
  }, [fetchError]);

  const updateDataset = ({
    updatedVariables,
    updatedSettings,
    updatedData,
  }) => {
    if (updatedVariables) setVariables(updatedVariables);
    if (updatedSettings) setSettings(updatedSettings);
    if (updatedData) setData(updatedData);
  };

  const onVariableChange = ({ variable, property, value }) => {
    let updatedVariables = variables.map((v) =>
      v.field === variable ? { ...v, [property]: value } : v
    );
    if (property === "isDeleted" && value === true) {
      updatedVariables = updatedVariables.filter((v) => v.field !== variable);
    }
    updateDataset({ updatedVariables });
  };

  const gridReadOnly = writeMode === "readOnly";

  if (loading || fetchLoading) return <div>Loading dataset...</div>;
  if (error || fetchError)
    return (
      <div style={{ color: "red" }}>
        Error: {error?.message || fetchError?.message}
      </div>
    );

  return (
    <StyledDatasetView>
      <div className="dataset-content">
        <div className="left-panel">
          <Menu
            dataset={dataset}
            data={data}
            variables={variables}
            settings={settings}
            components={components}
            updateDataset={updateDataset}
            onVariableChange={onVariableChange}
            onSaved={onSaved}
            onCopied={onCopied}
            writeMode={writeMode}
            currentVizPartId={currentVizPartId}
            projectId={projectId}
            studyId={studyId}
          />
        </div>

        <div className="right-panel">
          <Table
            data={data}
            variables={variables}
            settings={settings}
            updateDataset={updateDataset}
            readOnly={gridReadOnly}
          />
        </div>
      </div>
    </StyledDatasetView>
  );
}
