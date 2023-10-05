import { useQuery } from "@apollo/client";
import { GET_PARTICIPANT } from "../../../../Queries/User";

export default function ParticipantInformation({ studyId, participantId }) {
    const { data: participant } = useQuery(GET_PARTICIPANT, { 
        variables: { id: participantId }
    });

    console.log({ participant });


    return <div>Study-related information</div>
}