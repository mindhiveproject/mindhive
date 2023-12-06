import { useQuery } from "@apollo/client";
import { GET_PARTICIPANT_RESULTS } from "../../../../Queries/Result";
import Dataset from "./Dataset";

import Download from "./Download";

// https://vercel.com/guides/loading-static-file-nextjs-api-route
// https://swr.vercel.app/

export default function ParticipantResults({
  query,
  study,
  components,
  participantId,
}) {
  const dataToken = query?.data;

  const { data: results } = useQuery(GET_PARTICIPANT_RESULTS, {
    variables: { studyId: study?.id, participantId: participantId },
  });

  const datasets = results?.datasets || [];

  if (dataToken) {
    return <Dataset dataToken={dataToken} />;
  }

  return (
    <div>
      <h2>Participant results</h2>

      <div className="resultItem">
        <div>Study</div>
        <div>Task title</div>
        <div>Task subtitle</div>
        <div>Task ID</div>
        <div>Started</div>
        <div>Completed</div>
        <div>Condition</div>
        <div>Data policy</div>
        <div>Data analysis</div>
        <div></div>
      </div>

      {datasets?.map((dataset) => (
        <Download
          key={dataset?.token}
          dataset={dataset}
          components={components}
        />
      ))}
    </div>
  );
}
