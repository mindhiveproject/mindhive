import { useQuery } from "@apollo/client";

import Navigation from "../Navigation/Main";

import { DataJournalProvider } from "./Context/DataJournalContext";
import PyodideWrapper from "./Wrappers/PyodideWrapper";
import Journals from "./Journals";

import { useTour } from "./Tours/useTour";
import { journalTours } from "./Tours/journalTours";

import { GET_PROJECT_STUDY_ID } from "../../../Queries/Proposal";

export default function DataJournals({ user, query, tab, toggleSidebar }) {
  const projectId = query?.selector;

  if (!projectId) {
    return <div>No project found, please save your project first.</div>;
  }

  const { data, error, loading } = useQuery(GET_PROJECT_STUDY_ID, {
    variables: { id: projectId },
  });

  const studyId = data?.proposalBoard?.study?.id;

  useTour(journalTours);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading project data</div>;

  return (
    <>
      <Navigation
        proposalId={query?.selector}
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
      <DataJournalProvider
        initialProps={{
          // Pass defaults or fetched data as needed
          workspace: { layout: [], vizSections: [] },
          initData: [],
          initVariables: [],
          initSettings: {},
          pyodide: null, // Will be set asynchronously by PyodideWrapper
          selectedJournal: null,
          selectedWorkspace: null,
          user: user,
          projectId: projectId,
          studyId: studyId,
        }}
      >
        <PyodideWrapper user={user} projectId={projectId} studyId={studyId}>
          <Journals user={user} projectId={projectId} studyId={studyId} />
        </PyodideWrapper>
      </DataJournalProvider>
    </>
  );
}
