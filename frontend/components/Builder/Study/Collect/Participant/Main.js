import Link from "next/link";

import ParticipantInformation from "./Information";
import ParticipantResults from "./Results";

export default function ParticipantPage({ query, studyId, participantId }) {
    return <div className="participantPage">
        <Link
            href={{
                pathname: `/builder/studies`,
                query: {
                    selector: studyId,
                    tab: `collect`,
                }
            }}
        >
            <p>Go back</p>
        </Link>
        
        <div>
            <ParticipantInformation 
                studyId={studyId}
                participantId={participantId}  
            />
        </div>

        <div>
            <ParticipantResults 
                query={query}
                studyId={studyId}
                participantId={participantId}  
            />
        </div>
    </div>
}