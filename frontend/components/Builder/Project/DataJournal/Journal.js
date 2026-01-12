// Updated file: components/DataJournal/Journal.js
import { useQuery } from "@apollo/client";
import { useState, useEffect, useCallback } from "react";

import { GET_DATA_JOURNAL } from "../../../Queries/DataJournal";
import { StyledDataJournal } from "./styles/StyledDataJournal";

import Workspace from "./Workspace/Workspace";
import DatasourceDataLoader from "./DataLoader/DatasourceDataLoader";

import filterData, { renameData } from "./Helpers/Filter";
import { useDataJournal } from "./Context/DataJournalContext";

const prepareDataCode = `
import pandas as pd
import js_workspace as data
data = data.to_py()
df = pd.DataFrame(data)
`;

function mergeSourceDatas(sourceDatas) {
  let initData = [];
  let initVariables = [];
  let initSettings = {};

  sourceDatas.forEach(({ data, variables, settings, prefix }) => {
    const prefixedData = data.map((row) => {
      const newRow = {};
      Object.keys(row).forEach((key) => {
        const newKey = `${prefix}${key}`;
        newRow[newKey] =
          key === "participant" ? `${prefix}${row[key]}` : row[key];
      });
      return newRow;
    });

    initData = [...initData, ...prefixedData];

    const prefixedVariables = variables.map((v) => ({
      ...v,
      field: `${prefix}${v.field}`,
    }));

    initVariables = [...initVariables, ...prefixedVariables];

    initSettings = { ...initSettings, ...settings };
  });

  return { initData, initVariables, initSettings };
}

export default function Journal({
  user,
  journalCollections,
  dataJournals,
  journalId,
  selectJournalById,
}) {
  const {
    pyodide,
    selectedWorkspace,
    setSelectedWorkspace,
    setData,
    setVariables,
    setSettings,
  } = useDataJournal();

  // Get the data journal
  const {
    data: journalData,
    loading: queryLoading,
    error: queryError,
  } = useQuery(GET_DATA_JOURNAL, {
    variables: {
      id: journalId,
    },
    skip: !journalId,
  });

  const journal = journalData?.vizPart;

  const datasources = journal?.datasources || [];
  const workspaces = journal?.vizChapters || [];

  // States for aggregating data from datasources
  const [sourceDatas, setSourceDatas] = useState([]);
  const [mergedData, setMergedData] = useState(null);
  // Flag to gate rendering until data is registered in Pyodide
  const [registered, setRegistered] = useState(false);

  const initData = mergedData?.initData || [];
  const initDataLength = initData.length;

  const handleSourceData = useCallback((sourceData) => {
    setSourceDatas((prev) => {
      // Avoid duplicates by checking if already added (e.g., via id or prefix)
      if (prev.some((sd) => sd.prefix === sourceData.prefix)) return prev;
      return [...prev, sourceData];
    });
  }, []);

  useEffect(() => {
    if (sourceDatas.length === datasources.length && datasources.length > 0) {
      const merged = mergeSourceDatas(sourceDatas);
      setMergedData(merged);
    } else if (datasources.length === 0) {
      // If no datasources, use empty defaults
      setMergedData({ initData: [], initVariables: [], initSettings: {} });
    }
  }, [sourceDatas, datasources.length]);

  // Register data in Pyodide after merging
  useEffect(() => {
    async function registerData() {
      if (pyodide && mergedData?.initData && initDataLength) {
        const filteredData = filterData({
          data: mergedData.initData,
          settings: mergedData.initSettings,
        });
        const renamedData = renameData({
          data: filteredData,
          variables: mergedData.initVariables,
        });
        pyodide.registerJsModule("js_workspace", [...renamedData]);
        // Make data available as data and df (pandas dataframe)
        await pyodide.runPythonAsync(prepareDataCode);
        // Update context with merged data
        setData(mergedData.initData);
        setVariables(mergedData.initVariables);
        setSettings(mergedData.initSettings);
        setRegistered(true);
      }
    }
    registerData();
  }, [pyodide, mergedData, setData, setVariables, setSettings, initDataLength]);

  useEffect(() => {
    function initWorkspace() {
      if (workspaces && workspaces.length) {
        const w = workspaces[0]; // Set the first workspace as the current one
        setSelectedWorkspace(w);
      }
    }
    if (workspaces && workspaces.length) {
      initWorkspace();
    }
  }, [workspaces.length, setSelectedWorkspace]);

  const selectWorkspaceById = ({ id }) => {
    const workspace = workspaces.find((w) => w?.id === id);
    if (workspace) {
      setSelectedWorkspace(workspace);
    }
  };

  if (queryError) {
    return <div>Error loading journal</div>;
  }

  return (
    <StyledDataJournal>
      {/* Hidden loaders for each datasource */}
      <div style={{ display: "none" }}>
        {datasources.map((ds) => (
          <DatasourceDataLoader
            key={ds.id}
            datasource={ds}
            user={user} // Assuming user is available from higher context or prop if needed
            onDataReady={handleSourceData}
          />
        ))}
      </div>

      {queryLoading || !mergedData || !registered ? (
        <div>Loading...</div>
      ) : (
        <Workspace
          journalCollections={journalCollections}
          dataJournals={dataJournals}
          journal={journal}
          journalId={journalId}
          selectJournalById={selectJournalById}
          workspaces={workspaces}
          workspaceId={selectedWorkspace?.id}
          selectWorkspaceById={selectWorkspaceById}
        />
      )}
    </StyledDataJournal>
  );
}
