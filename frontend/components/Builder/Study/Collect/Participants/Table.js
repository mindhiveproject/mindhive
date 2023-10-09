import { useQuery } from "@apollo/client";
import { GET_STUDY_PARTICIPANTS } from "../../../../Queries/User";

import UserRowWrapper from "./UserRowWrapper";
import GuestRowWrapper from "./GuestRowWrapper";

export default function ParticipantsTable({ studyId }) {
  const { data, loading, error } = useQuery(GET_STUDY_PARTICIPANTS, {
    variables: { id: studyId },
  });

  const st = data?.study || { participants: [], guests: [] };
  const { participants } = st;
  const { guests } = st;
  const allParticipants = [...participants, ...guests];

  return (
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
            if(participant?.type === "GUEST") {
              return (
                <GuestRowWrapper 
                  key={num} 
                  num={num} 
                  studyId={studyId} 
                  participant={participant} 
                />
              )
            } else {
              return (
                <UserRowWrapper 
                  key={num} 
                  num={num} 
                  studyId={studyId} 
                  participant={participant} 
                />
              )
            }
          }
            
          )}
        </div>
      </div>
    </div>
  );
}
