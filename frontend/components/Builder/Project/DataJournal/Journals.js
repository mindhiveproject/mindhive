import { useQuery } from "@apollo/client";
import { useState, useEffect } from "react";

import { GET_DATA_JOURNALS } from "../../../Queries/DataArea";
import { StyledDataArea } from "./styles/StyledDataJournal";
import { useDataJournal } from "./Context/DataJournalContext";

import Journal from "./Journal";

export default function Journals({ user, projectId, studyId }) {
  const { selectedJournal, setSelectedJournal } = useDataJournal();

  // Get the data journals of the study and the project
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

  // Get all data journals
  const dataJournals =
    data?.vizJournals?.map((vizJournal) => vizJournal.vizParts).flat() || [];

  const journalCollections = data?.vizJournals || [];

  useEffect(() => {
    function initJournal() {
      const j = dataJournals[0]; // set the first journal as the current one
      setSelectedJournal(j);
    }
    if (dataJournals && dataJournals.length) {
      initJournal();
    }
  }, [dataJournals.length, setSelectedJournal]);

  const selectJournalById = ({ id }) => {
    const journal = dataJournals.find((j) => j?.id === id);
    if (journal) {
      setSelectedJournal(journal);
    }
  };

  if (loading) return <div>Loading journals...</div>;
  if (error) return <div>Error loading journals: {error.message}</div>;

  return (
    <StyledDataArea>
      <Journal
        user={user}
        journalCollections={journalCollections}
        dataJournals={dataJournals}
        journalId={selectedJournal?.id}
        selectJournalById={selectJournalById}
      />
    </StyledDataArea>
  );
}
