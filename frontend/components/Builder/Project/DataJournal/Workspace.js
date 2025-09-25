// this is a main central file to keep and sync the state of the workspace (VizChapter)

import { useQuery } from "@apollo/client";
import { useState, useEffect } from "react";

import { GET_WORKSPACE } from "../../../Queries/DataWorkspace";
import { StyledDataWorkspace } from "./styles/StyledDataJournal";
import filterData, { renameData } from "./Helpers/Filter";
const prepareDataCode = ``;

import Grid from "./Workspace/Grid";

export default function Workspace({
  user,
  projectId,
  studyId,
  dataJournals,
  journal,
  journalId,
  selectJournalById,
  workspaces,
  workspaceId,
  selectWorkspaceById,
  pyodide,
  initData,
  initVariables,
  initSettings,
}) {
  // register data relevant for this workspace
  useEffect(() => {
    async function registerData() {
      if (pyodide && initData) {
        // delete the previous data if they are registered
        const sys = pyodide.pyimport("sys");
        if (sys.modules.get("js_workspace")) {
          sys.modules.delete("js_workspace");
        }
        const filteredData = filterData({
          data: initData,
          settings: initSettings,
        });
        const renamedData = renameData({
          data: filteredData,
          variables: initVariables,
        });
        pyodide?.registerJsModule("js_workspace", [...renamedData]);
        // make data available as data and df (pandas dataframe)
        await pyodide.runPythonAsync(prepareDataCode);
      }
    }
    registerData();
  }, [pyodide, initData, initSettings]);

  // the state of the workspace
  const [workspace, setWorkspace] = useState({ layout: [], vizSections: [] });

  const { data, loading, error } = useQuery(GET_WORKSPACE, {
    variables: { id: workspaceId },
  });

  const workspaceServer = data?.vizChapter || null;

  useEffect(() => {
    if (workspaceServer) {
      setWorkspace(workspaceServer);
    }
  }, [workspaceServer]);

  const updateWorkspace = (obj) => {
    setWorkspace((prev) => ({ ...prev, ...obj }));
  };

  return (
    <Grid
      user={user}
      projectId={projectId}
      studyId={studyId}
      dataJournals={dataJournals}
      journal={journal}
      journalId={journalId}
      selectJournalById={selectJournalById}
      workspaces={workspaces}
      workspace={workspace}
      updateWorkspace={updateWorkspace}
      selectWorkspaceById={selectWorkspaceById}
      pyodide={pyodide}
      initData={initData}
      initVariables={initVariables}
      initSettings={initSettings}
    />
  );
}
