import Link from "next/link";

import { useQuery } from "@apollo/client";
import { GET_PARTICIPANT_RESULTS } from "../../../../Queries/Result";
import Dataset from "./Dataset";

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
        {datasets?.map(result => 
        <div key={result?.token}>
            {result?.token}
            <Link
                href={{
                    pathname: `/builder/studies`,
                    query: {
                        selector: studyId,
                        tab: `collect`,
                        id: participantId,
                        data: result?.token
                    }
                }}
            >
            <p>see the data</p>
            </Link>
        </div>
        )}
    </div>
}