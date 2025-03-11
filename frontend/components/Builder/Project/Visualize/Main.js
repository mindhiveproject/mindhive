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

export default function Visualize({
  query,
  user,
  tab,
  toggleSidebar,
  projectId,
  studyId,
}) {
  return (
    <>
      <Navigation
        proposalId={query?.selector}
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
      <PyodideWrapper user={user} projectId={projectId} studyId={studyId} />
    </>
  );
}
