// ---- Structure ------
//  Pyodide wrapper (PyodideWrapper.js)
//    Journals (Journals.js)
//      Journal (Journal.js) // data fetching
//        Workspace
//          Grid ("./Workspace/Grid")
//            Datasets
//            SideNavigation
//            GridLayout
//            ComponentEditor
//            ComponentPanel

import Navigation from "../Navigation/Main";
import PyodideWrapper from "./PyodideWrapper";

import { useQuery } from "@apollo/client";
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
