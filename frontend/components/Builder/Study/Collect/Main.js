import { useQuery } from "@apollo/client";

import { StyledCollectPage } from "../../../styles/StyledBuilder";
import { GET_STUDY_PARTICIPANTS } from "../../../Queries/User";

import Navigation from "../Navigation/Main";
import ParticipantPage from "./Participant/Main";
import Table from "./Table/Main";

export default function Collect({ query, user, tab, toggleSidebar }) {
  const studyId = query?.selector;
  const participantId = query?.id;
  const { type } = query;

  if (!studyId) {
    return <div>No study found, please save your study first.</div>;
  }

  const { data, loading, error } = useQuery(GET_STUDY_PARTICIPANTS, {
    variables: { id: studyId },
  });

  const study = data?.study || { participants: [], guests: [] };

  // find all tests in the study with recursive search
  var components = [];
  const findComponents = ({ flow, conditionLabel }) => {
    flow?.forEach((stage) => {
      if (stage?.type === "my-node") {
        components.push({
          testId: stage?.testId,
          name: stage?.name,
          subtitle: stage?.subtitle,
          conditionLabel,
        });
      }
      if (stage?.type === "design") {
        stage?.conditions?.forEach((condition) => {
          findComponents({
            flow: condition?.flow,
            conditionLabel: condition?.label,
          });
        });
      }
    });
  };
  findComponents({ flow: study?.flow });

  return (
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
      <StyledCollectPage>
        {participantId ? (
          <ParticipantPage
            query={query}
            study={study}
            components={components}
            participantId={participantId}
            type={type}
          />
        ) : (
          <div className="collectBoard">
            <Table study={study} components={components} />
          </div>
        )}
      </StyledCollectPage>
    </>
  );
}
