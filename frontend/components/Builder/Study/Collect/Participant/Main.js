import Link from "next/link";

import ParticipantInformation from "./Information";
import ParticipantResults from "./Results";

export default function ParticipantPage({
  query,
  study,
  components,
  participantId,
}) {
  return (
    <div className="participantPage">
      <Link
        href={{
          pathname: `/builder/studies`,
          query: {
            selector: study?.id,
            tab: `collect`,
          },
        }}
      >
        <p>Go back</p>
      </Link>

      <div>
        <ParticipantInformation study={study} participantId={participantId} />
      </div>

      <div>
        <ParticipantResults
          query={query}
          study={study}
          participantId={participantId}
          components={components}
        />
      </div>
    </div>
  );
}
