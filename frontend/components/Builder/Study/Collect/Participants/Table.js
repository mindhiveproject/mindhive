import Header from "./Header";
import UserRowWrapper from "./UserRowWrapper";
import GuestRowWrapper from "./GuestRowWrapper";

export default function ParticipantsTable({ study, components }) {
  const { participants } = study;
  const { guests } = study;
  const allParticipants = [...participants, ...guests];

  return (
    <>
      <Header
        study={study}
        slug={study.slug}
        participants={allParticipants}
        components={components}
      />
      <div className="participants">
        <div className="participantsBoard">
          <div className="tableHeader">
            <p>Participant ID</p>
            <p>Public readable ID</p>
            <p>Started</p>
            <p>Number of completed tasks</p>
            <p>Condition</p>
            <p>Consent decision</p>
            <p>Account</p>
            <p>Include all data in analysis</p>
          </div>
          <div>
            {allParticipants.map((participant, num) => {
              if (participant?.type === "GUEST") {
                return (
                  <GuestRowWrapper
                    key={num}
                    num={num}
                    studyId={study?.id}
                    participant={participant}
                  />
                );
              } else {
                return (
                  <UserRowWrapper
                    key={num}
                    num={num}
                    studyId={study?.id}
                    participant={participant}
                  />
                );
              }
            })}
          </div>
        </div>
      </div>
    </>
  );
}
