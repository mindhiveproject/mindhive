// ---- Structure ------
// Visualize (Main.js)
//  Data preprocessor (Preprocessor.js)
//    Data state manager (DataManager.js)
//      Journal manager (JournalManager.js)

import Navigation from "../Navigation/Main";
import Preprocessor from "./Preprocessor";

export default function Visualize({ query, user, tab, toggleSidebar }) {
  const studyId = query?.selector;

  return (
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
      {!studyId && <>No study found, please save your study first.</>}
      {studyId && <Preprocessor user={user} studyId={studyId} />}
    </>
  );
}
