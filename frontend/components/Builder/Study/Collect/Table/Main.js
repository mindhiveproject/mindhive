import Header from "./Header";
import UserRowWrapper from "./UserRowWrapper";
import GuestRowWrapper from "./GuestRowWrapper";
import { useState } from "react";

import ParticipantsPagination from "./Pagination";

export default function ParticipantsTable({ study, components }) {
  // page setup
  const perPage = 20;
  const [page, setPage] = useState(1);

  const { participants } = study;
  const { guests } = study;
  const allParticipants = [...participants, ...guests];
  const count = allParticipants.length;

  const consents = study?.consent || [];

  // order participants by the time moment when they joined the study
  const orderedParticipants = [...allParticipants].sort((a, b) => {
    const timeA =
      (a?.studiesInfo?.[study?.id]?.info?.path.length &&
        a?.studiesInfo?.[study?.id]?.info?.path[0]?.timestampFinished) ||
      0;
    const timeB =
      (b?.studiesInfo?.[study?.id]?.info?.path.length &&
        b?.studiesInfo?.[study?.id]?.info?.path[0]?.timestampFinished) ||
      0;
    return timeA > timeB ? -1 : 1;
  });

  const participantsOnPage = orderedParticipants.slice(
    page * perPage - perPage,
    page * perPage
  );

  return (
    <>
      <Header
        study={study}
        slug={study.slug}
        participants={orderedParticipants}
        components={components}
      />
      <div className="participants">
        <div className="participantsBoard">
          {count > 0 && (
            <ParticipantsPagination
              page={page}
              perPage={perPage}
              count={count}
              setPage={setPage}
            />
          )}

          <div className="tableHeader">
            <p>Participant ID</p>
            <p>Public readable ID</p>
            <p>Started</p>
            <p>Number of completed tasks</p>
            <p>Condition</p>
            <p>IRB consent decision</p>
            <p>Account</p>
            <p>Include all data in analysis</p>
          </div>

          <div>
            {participantsOnPage.map((participant, num) => {
              if (participant?.type === "GUEST") {
                return (
                  <GuestRowWrapper
                    key={num}
                    num={num}
                    studyId={study?.id}
                    participant={participant}
                    consents={consents}
                  />
                );
              } else {
                return (
                  <UserRowWrapper
                    key={num}
                    num={num}
                    studyId={study?.id}
                    participant={participant}
                    consents={consents}
                  />
                );
              }
            })}
          </div>

          {count > 5 && (
            <ParticipantsPagination
              page={page}
              perPage={perPage}
              count={count}
              setPage={setPage}
            />
          )}
        </div>
      </div>
    </>
  );
}
