// components/DataJournal/Workspace/Workspace.js
import { useQuery } from "@apollo/client";
import { useEffect } from "react";

import { GET_WORKSPACE } from "../../../../Queries/DataWorkspace";
import { useDataJournal } from "../Context/DataJournalContext";

import Grid from "./Grid/Grid"; // Adjust path based on structure

export default function Workspace({
  journalCollections,
  dataJournals,
  journal,
  journalId,
  selectJournalById,
  workspaces,
  workspaceId,
  selectWorkspaceById,
}) {
  const {
    workspace,
    setWorkspace,
    updateWorkspace,
    data,
    variables,
    settings,
    pyodide,
  } = useDataJournal();

  const {
    data: queryData,
    loading,
    error,
  } = useQuery(GET_WORKSPACE, {
    variables: { id: workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  const workspaceServer = queryData?.vizChapter || null;

  useEffect(() => {
    if (workspaceServer) {
      setWorkspace(workspaceServer);
    }
  }, [workspaceServer, setWorkspace]);

  if (loading) return <div>Loading workspace...</div>;
  if (error) return <div>Error loading workspace: {error.message}</div>;

  return (
    <Grid
      journalCollections={journalCollections}
      dataJournals={dataJournals}
      journal={journal}
      journalId={journalId}
      selectJournalById={selectJournalById}
      workspaces={workspaces}
      workspaceId={workspaceId}
      selectWorkspaceById={selectWorkspaceById}
    />
  );
}
