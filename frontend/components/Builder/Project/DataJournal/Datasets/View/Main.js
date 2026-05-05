import { useState, useEffect } from "react";

import { StyledDatasetView } from "../../styles/StyledDatasetView";

import Menu from "./Menu";
import Table from "./Table";
import useDatasourceData from "../../DataLoader/useDatasourceData";

export default function DatasetView({ dataset, user, onSaved }) {
  const {
    data: fetchedData,
    variables: fetchedVariables,
    settings: fetchedSettings,
    loading: fetchLoading,
    error: fetchError,
    refetch,
  } = useDatasourceData({ datasource: dataset, user });

  const [data, setData] = useState([]);
  const [variables, setVariables] = useState([]);
  const [settings, setSettings] = useState({ filter: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (fetchedData && fetchedVariables && fetchedSettings) {
      setData(fetchedData);
      setVariables(fetchedVariables);
      setSettings(fetchedSettings);
      setLoading(false);
    }
  }, [fetchedData, fetchedVariables, fetchedSettings]);

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
            components={[]}
            updateDataset={updateDataset}
            onVariableChange={onVariableChange}
            onSaved={onSaved}
          />
        </div>

        <div className="right-panel">
          <Table
            data={data}
            variables={variables}
            settings={settings}
            updateDataset={updateDataset}
          />
        </div>
      </div>
    </StyledDatasetView>
  );
}
