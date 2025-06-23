// ---- Structure ------
// DataJournals
//  Journals
//
//
//

import Navigation from "../Navigation/Main";
import Journals from "./Journals";

export default function DataJournals({ user, query, tab, toggleSidebar }) {
  const projectId = query?.selector;
  const studyId = "cm8wt73yb0001m4o1q24hh3j1";

  return (
    <>
      <Navigation
        proposalId={query?.selector}
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
      <Journals user={user} projectId={projectId} studyId={studyId} />
    </>
  );
}
