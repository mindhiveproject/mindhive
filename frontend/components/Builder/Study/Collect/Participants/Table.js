import { useQuery } from "@apollo/client";
import { GET_STUDY_PARTICIPANTS } from "../../../../Queries/User";

import Row from "./Row";

export default function ParticipantsTable({ studyId }) {
  const { data, loading, error } = useQuery(GET_STUDY_PARTICIPANTS, {
    variables: { id: studyId },
  });

  const st = data?.study || { participants: [] };
  const { participants } = st;
  console.log({ participants });

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
          {participants.map((participant, num) => 
            <Row 
              key={num} 
              num={num} 
              studyId={studyId} 
              participant={participant} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
