// components/DataJournal/Workspace/Workspace.js
import { useQuery } from "@apollo/client";
import { useEffect } from "react";
import useTranslation from "next-translate/useTranslation";

import { GET_WORKSPACE } from "../../../../Queries/DataWorkspace";
import { useDataJournal } from "../Context/DataJournalContext";

import Grid from "./Grid/Grid"; // Adjust path based on structure

const EMPTY_WORKSPACE = { id: null, layout: [], vizSections: [] };

export default function Workspace({
  user,
  studyId,
  journalCollections,
  dataJournals,
  journal,
  journalId,
  selectJournalById,
  workspaces,
  workspaceId,
  selectWorkspaceById,
}) {
  const { t } = useTranslation("builder");
  const { setWorkspace } = useDataJournal();

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
    if (!workspaceId) {
      setWorkspace(EMPTY_WORKSPACE);
      return;
    }
    if (workspaceServer && workspaceServer.id === workspaceId) {
      setWorkspace(workspaceServer);
      return;
    }
    if (error) {
      setWorkspace(EMPTY_WORKSPACE);
      return;
    }
    if (!loading && queryData && workspaceServer == null) {
      setWorkspace(EMPTY_WORKSPACE);
    }
  }, [
    workspaceId,
    workspaceServer,
    loading,
    error,
    queryData,
    setWorkspace,
  ]);

  if (workspaceId && loading) {
    return (
      <div>
        {t("dataJournal.workspaceArea.loading", {}, { default: "Loading workspace…" })}
      </div>
    );
  }
  if (workspaceId && error) {
    return (
      <div>
        {t(
          "dataJournal.workspaceArea.error",
          { message: error.message },
          { default: "Could not load workspace: {{message}}" },
        )}
      </div>
    );
  }

  return (
    <Grid
      user={user}
      studyId={studyId}
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
