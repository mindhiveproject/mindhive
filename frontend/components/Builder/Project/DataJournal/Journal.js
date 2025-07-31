import { useQuery } from "@apollo/client";
import { useState, useEffect } from "react";

import { GET_DATA_JOURNAL } from "../../../Queries/DataJournal";
import { StyledDataJournal } from "./styles/StyledDataJournal";

import StudyDataWrapper from "./StudyDataWrapper";

export default function Journal({
  user,
  studyId,
  dataJournals,
  journalId,
  selectJournalById,
  pyodide,
}) {
  // the state for the currently active workspace
  const [workspace, setWorkspace] = useState(null);

  // get the data journals of the study and the project
  const { data, loading, error } = useQuery(GET_DATA_JOURNAL, {
    variables: {
      id: journalId,
    },
  });

  const journal = data?.vizPart;

  const workspaces = journal?.vizChapters || [];

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

  return (
    <StyledDataJournal>
      {workspace && (
        <StudyDataWrapper
          user={user}
          studyId={studyId}
          dataJournals={dataJournals}
          journal={journal}
          journalId={journalId}
          selectJournalById={selectJournalById}
          workspaces={workspaces}
          workspaceId={workspace?.id}
          selectWorkspaceById={selectWorkspaceById}
          pyodide={pyodide}
        />
      )}
    </StyledDataJournal>
  );
}
