import { useQuery } from "@apollo/client";
import { GET_PROJECT_STUDY_ID } from "../../../Queries/Proposal";

import Visualize from "./Main";

export default function ProjectWrapper({ query, user, tab, toggleSidebar }) {
  const projectId = query?.selector;

  if (!projectId) {
    return <div>No project found, please save your project first.</div>;
  }

  const { data, error, loading } = useQuery(GET_PROJECT_STUDY_ID, {
    variables: { id: projectId },
  });

  const studyId = data?.proposalBoard?.study?.id;

  return (
    <Visualize
      query={query}
      user={user}
      tab={tab}
      toggleSidebar={toggleSidebar}
      projectId={projectId}
      studyId={studyId}
    />
  );
}
