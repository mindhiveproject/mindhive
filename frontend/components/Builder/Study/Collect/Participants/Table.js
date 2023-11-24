import { useQuery } from "@apollo/client";
import { GET_STUDY_PARTICIPANTS } from "../../../../Queries/User";

import Header from "./Header";
import UserRowWrapper from "./UserRowWrapper";
import GuestRowWrapper from "./GuestRowWrapper";

export default function ParticipantsTable({ studyId }) {
  const { data, loading, error } = useQuery(GET_STUDY_PARTICIPANTS, {
    variables: { id: studyId },
  });

  const study = data?.study || { participants: [], guests: [] };
  const { participants } = study;
  const { guests } = study;
  const allParticipants = [...participants, ...guests];

  // find all tests in the study with recursive search
  var components = [];
  const findComponents = ({ flow }) => {
    flow?.forEach((stage) => {
      if (stage?.type === "my-node") {
        components.push({
          testId: stage?.testId,
          name: stage?.name,
          subtitle: stage?.subtitle,
        });
      }
      if (stage?.type === "design") {
        stage?.conditions?.forEach((condition) => {
          findComponents({
            flow: condition?.flow,
          });
        });
      }
    });
  };
  findComponents({ flow: study?.flow });

  return (
    <>
      <Header
        study={study}
        slug={study.slug}
        participants={allParticipants}
        components={components}
      />
      <div className="participants">
        <div className="participantsBoard">
          <div className="tableHeader">
            <p>Public ID</p>
            <p>Duration</p>
            <p>Number of completed tasks</p>
            <p>Condition name</p>

            <p>Consent decision</p>
            <p>Timestamp of consent decision</p>
            <p>Account</p>
            <p>Include in analysis</p>
          </div>
          <div>
            {allParticipants.map((participant, num) => {
              if (participant?.type === "GUEST") {
                return (
                  <GuestRowWrapper
                    key={num}
                    num={num}
                    studyId={studyId}
                    participant={participant}
                  />
                );
              } else {
                return (
                  <UserRowWrapper
                    key={num}
                    num={num}
                    studyId={studyId}
                    participant={participant}
                  />
                );
              }
            })}
          </div>
        </div>
      </div>
    </>
  );
}
