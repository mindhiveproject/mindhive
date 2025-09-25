// Updated file: components/DataJournal/Journal.js
import { useQuery } from "@apollo/client";
import { useState, useEffect, useCallback } from "react";

import { GET_DATA_JOURNAL } from "../../../Queries/DataJournal";
import { StyledDataJournal } from "./styles/StyledDataJournal";

import Workspace from "./Workspace"; // Assuming this is the child component
import DatasourceDataLoader from "./DataLoader/DatasourceDataLoader";

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
  projectId,
  studyId,
  dataJournals,
  journalId,
  selectJournalById,
  pyodide,
}) {
  // the state for the currently active workspace
  const [workspace, setWorkspace] = useState(null);

  // get the data journals of the study and the project
  const {
    data,
    loading: queryLoading,
    error: queryError,
  } = useQuery(GET_DATA_JOURNAL, {
    variables: {
      id: journalId,
    },
  });

  const journal = data?.vizPart;

  const datasources = journal?.datasources || [];
  const workspaces = journal?.vizChapters || [];

  // States for aggregating data from datasources
  const [sourceDatas, setSourceDatas] = useState([]);
  const [mergedData, setMergedData] = useState(null);

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

  useEffect(() => {
    function initWorkspace() {
      if (workspaces && workspaces.length) {
        const j = workspaces[0]; // set the first journal as the current one
        setWorkspace(j);
      }
    }
    if (workspaces && workspaces.length) {
      initWorkspace();
    }
  }, [workspaces.length]);

  const selectWorkspaceById = ({ id }) => {
    const workspace = workspaces.find((w) => w?.id === id);
    if (workspace) {
      setWorkspace(workspace);
    }
  };

  if (queryLoading || !mergedData) {
    return <div>Loading...</div>;
  }

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
            user={user}
            onDataReady={handleSourceData}
          />
        ))}
      </div>

      {workspace && (
        <Workspace
          user={user}
          projectId={projectId}
          studyId={studyId}
          dataJournals={dataJournals}
          journal={journal}
          journalId={journalId}
          selectJournalById={selectJournalById}
          workspaces={workspaces}
          workspaceId={workspace?.id}
          selectWorkspaceById={selectWorkspaceById}
          pyodide={pyodide}
          initData={mergedData.initData}
          initVariables={mergedData.initVariables}
          initSettings={mergedData.initSettings}
        />
      )}
    </StyledDataJournal>
  );
}
