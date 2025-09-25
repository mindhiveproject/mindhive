import { useQuery } from "@apollo/client";
import { useState, useEffect } from "react";

import { GET_DATA_JOURNALS } from "../../../Queries/DataArea";
import { StyledDataArea } from "./styles/StyledDataJournal";

import Journal from "./Journal";

export default function Journals({ user, projectId, studyId, pyodide }) {
  // the state for the currently active journal
  const [journal, setJournal] = useState(null);

  // get the data journals of the study and the project
  const { data, loading, error } = useQuery(GET_DATA_JOURNALS, {
    variables: {
      where:
        projectId && studyId
          ? {
              OR: [
                { project: { id: { equals: projectId } } },
                { study: { id: { equals: studyId } } },
              ],
            }
          : projectId
          ? { project: { id: { equals: projectId } } }
          : studyId
          ? { study: { id: { equals: studyId } } }
          : null,
    },
  });

  // get all data journals
  const dataJournals =
    data?.vizJournals?.map((vizJournal) => vizJournal.vizParts).flat() || [];

  useEffect(() => {
    function initJournal() {
      if (dataJournals && dataJournals.length) {
        const j = dataJournals[0]; // set the first journal as the current one
        setJournal(j);
      }
    }
    if (dataJournals && dataJournals.length) {
      initJournal();
    }
  }, [dataJournals.length]);

  const selectJournalById = ({ id }) => {
    const journal = dataJournals.find((j) => j?.id === id);
    if (journal) {
      setJournal(journal);
    }
  };

  return (
    <StyledDataArea>
      {journal && (
        <Journal
          user={user}
          projectId={projectId}
          studyId={studyId}
          dataJournals={dataJournals}
          journalId={journal?.id}
          selectJournalById={selectJournalById}
          pyodide={pyodide}
        />
      )}
    </StyledDataArea>
  );
}
