// ---- Structure ------
// DataJournal (Main.js)
// - Top navigation menu (internal, for data journal navigation)
//  -- Switch between Journals/Datasets view
//  -- Breadcrumbs
//  -- Export function button
//  -- Share function button
//  -- Add a Componenent button
//  -- Chat toggle
//
// - Sidebar (on the left): navigation, adding workspace
//
// - Workspace canvas
// - Editor
//
// Open question - on which level the journal and dataset are connected?
// Pyodide environment is connected to the whole Data Journals space (saves time when switching between journals)
// Pyodide code is connected with Element
//
// Architecture
//  Pyodide wrapper (PyodideWrapper.js)
//    Journal manager (JournalManager.js)
//      DataWrapper

import Navigation from "../Navigation/Main";

export default function DataJournal({ query, user, tab, toggleSidebar }) {
  return (
    <>
      <Navigation
        proposalId={query?.selector}
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
      Data Journals
    </>
  );
}
