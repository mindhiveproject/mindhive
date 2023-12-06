import Link from "next/link";

import UserWrapper from "./UserWrapper";
import GuestWrapper from "./GuestWrapper";

import ParticipantResults from "./Results";

export default function ParticipantPage({
  query,
  study,
  components,
  participantId,
  type,
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
        <p>← Go back</p>
      </Link>

      {type === "user" ? (
        <UserWrapper study={study} publicId={participantId} type={type} />
      ) : (
        <GuestWrapper study={study} publicId={participantId} type={type} />
      )}

      <ParticipantResults
        query={query}
        study={study}
        participantId={participantId}
        components={components}
      />
    </div>
  );
}
