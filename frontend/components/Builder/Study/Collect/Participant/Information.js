import { useQuery } from "@apollo/client";
import { GET_PARTICIPANT } from "../../../../Queries/User";

export default function ParticipantInformation({ study, participantId }) {
  const { data: participant } = useQuery(GET_PARTICIPANT, {
    variables: { id: participantId },
  });

  return <div>Study-related information</div>;
}
