import RoundsList from "./List";
import RoundEditor from "./Editor";
import RoleGuard from "../RoleGuard";

export default function RoundsMain({ query, user }) {
  const { round } = query;

  return (
    <RoleGuard allow={["teacher"]}>
      {round ? (
        <RoundEditor query={query} user={user} roundId={round} />
      ) : (
        <RoundsList query={query} user={user} />
      )}
    </RoleGuard>
  );
}
