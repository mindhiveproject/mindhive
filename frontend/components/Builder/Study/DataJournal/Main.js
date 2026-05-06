import Navigation from "../Navigation/Main";

import { DataJournalProvider } from "../../Project/DataJournal/Context/DataJournalContext";
import PyodideWrapper from "../../Project/DataJournal/Wrappers/PyodideWrapper";
import Journals from "../../Project/DataJournal/Journals";

import { useTour } from "../../Project/DataJournal/Tours/useTour";
import { journalTours } from "../../Project/DataJournal/Tours/journalTours";

export default function DataJournals({ user, query, tab, toggleSidebar }) {
  const studyId = query?.selector;

  if (!studyId) {
    return <div>No study found, please save your study first.</div>;
  }

  useTour(journalTours);

  return (
    <>
      <Navigation
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
          projectId: null,
          studyId: studyId,
        }}
      >
        <PyodideWrapper user={user} projectId={null} studyId={studyId}>
          <Journals user={user} projectId={null} studyId={studyId} />
        </PyodideWrapper>
      </DataJournalProvider>
    </>
  );
}
