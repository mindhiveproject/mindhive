// ---- Structure ------
// Visualize (Main.js)
//  Pyodide wrapper (PyodideWrapper.js)
//    Journal manager (JournalManager.js)
//      StudyDataWrapper or UploadedDataWrapper (optional)
//        Part manager (PartManager.js)
//          Preprocessing manager (ProcessManager.js) - data and variables state
//            Overview and Document

import Navigation from "../Navigation/Main";
import PyodideWrapper from "./PyodideWrapper";

import InDev from "../../../Global/InDev";

export default function Visualize({ query, user, tab, toggleSidebar }) {
  const studyId = query?.selector;

  const inDev = true;
  if (inDev) {
    return (
      <>
        <Navigation
          proposalId={query?.selector}
          query={query}
          user={user}
          tab={tab}
          toggleSidebar={toggleSidebar}
        />
        <InDev
          header="🤷🏻 Sorry, no study found, please create your study first."
          message="If you need help, please contact the tech support at info@mindhive.science"
        />
      </>
    );
  }

  return (
    <>
      <Navigation
        proposalId={query?.selector}
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
      {!studyId && <>No study found, please save your study first.</>}
      {studyId && <PyodideWrapper user={user} studyId={studyId} />}
    </>
  );
}
