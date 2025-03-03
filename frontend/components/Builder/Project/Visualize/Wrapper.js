import { useQuery } from "@apollo/client";
import { GET_PROJECT_STUDY_ID } from "../../../Queries/Proposal";

import Visualize from "./Main";
import Navigation from "../Navigation/Main";
import InDev from "../../../Global/InDev";

export default function ProjectWrapper({ query, user, tab, toggleSidebar }) {
  const projectId = query?.selector;

  if (!projectId) {
    return <div>No project found, please save your project first.</div>;
  }

  const { data, error, loading } = useQuery(GET_PROJECT_STUDY_ID, {
    variables: { id: projectId },
  });

  const studyId = data?.proposalBoard?.study?.id;

  if (studyId) {
    return (
      <Visualize
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
        studyId={studyId}
      />
    );
  } else {
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
}
