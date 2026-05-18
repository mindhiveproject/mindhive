import ParticipateList from "./List";
import ParticipateSubmission from "./Submission";
import RoleGuard from "../RoleGuard";

export default function ParticipateMain({ query, user }) {
  const { round } = query;

  return (
    <RoleGuard allow={["student"]}>
      {round ? (
        <ParticipateSubmission query={query} user={user} roundId={round} />
      ) : (
        <ParticipateList query={query} user={user} />
      )}
    </RoleGuard>
  );
}
