// this is a main central file to keep and sync the state of the workspace (VizChapter)

import { useQuery } from "@apollo/client";
import { useState, useEffect } from "react";

import { GET_WORKSPACE } from "../../../Queries/DataWorkspace";
import { StyledDataWorkspace } from "./styles/StyledDataJournal";

import Grid from "./Workspace/Grid";

export default function Workspace({
  dataJournals,
  journalId,
  selectJournalById,
  workspaces,
  workspaceId,
  selectWorkspaceById,
}) {
  const [workspace, setWorkspace] = useState({ layout: [], vizSections: [] });

  const { data, loading, error } = useQuery(GET_WORKSPACE, {
    variables: { id: workspaceId },
  });

  const workspaceServer = data?.vizChapter || null;

  useEffect(() => {
    if (workspaceServer) {
      // setWorkspace({
      //   layout: workspaceServer.layout || [],
      //   vizSections: workspaceServer.vizSections || [],
      // });
      setWorkspace(workspaceServer);
    }
  }, [workspaceServer]);

  const updateWorkspace = (obj) => {
    setWorkspace((prev) => ({ ...prev, ...obj }));
  };

  return (
    <StyledDataWorkspace>
      <Grid
        dataJournals={dataJournals}
        journalId={journalId}
        selectJournalById={selectJournalById}
        workspaces={workspaces}
        workspace={workspace}
        updateWorkspace={updateWorkspace}
        selectWorkspaceById={selectWorkspaceById}
      />
    </StyledDataWorkspace>
  );
}
