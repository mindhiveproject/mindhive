import MatchesList from "./List";
import RoundMatches from "./RoundMatches";
import RoleGuard from "../RoleGuard";

export default function MatchesMain({ query, user }) {
  const { round } = query;

  return (
    <RoleGuard allow={["teacher"]}>
      {round ? (
        <RoundMatches query={query} user={user} roundId={round} />
      ) : (
        <MatchesList query={query} user={user} />
      )}
    </RoleGuard>
  );
}
