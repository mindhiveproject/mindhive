import { useQuery } from "@apollo/client";
import { GET_PARTICIPANT_RESULTS } from "../../../../Queries/Result";
import Dataset from "./Dataset";

import Row from "./Row";

// https://vercel.com/guides/loading-static-file-nextjs-api-route
// https://swr.vercel.app/

export default function ParticipantResults({ query, studyId, participantId }) {
    const dataToken = query?.data;

    const { data: results } = useQuery(GET_PARTICIPANT_RESULTS, { 
        variables: { studyId: studyId, participantId: participantId }
    });

    const datasets = results?.datasets || [];

    if(dataToken) {
        return <Dataset dataToken={dataToken} />
    }

    return <div>
        <h2>Participant results</h2>

        <div className="resultItem">
            <div>Study</div>
            <div>Task title</div>
            <div>Task subtitle</div>
            <div>Task ID</div>
            <div>Created</div>
            <div>Updated</div>
            <div>Data policy</div>
            <div>Payload type</div>
            <div>Is full data?</div>
            <div># Files</div>
            <div># Partial uploads</div>
            <div>Data analysis</div>
            <div></div>
            <div></div>
        </div>

        {datasets?.map(result => 
            <Row 
                key={result?.token}
                studyId={studyId} 
                participantId={participantId}
                result={result} 
            />
        )}
    </div>
}