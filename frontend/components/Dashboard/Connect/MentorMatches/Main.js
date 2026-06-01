import RoleGuard from "../RoleGuard";
import MentorMatchesList from "./List";

export default function MentorMatchesMain({ query, user }) {
  return (
    <RoleGuard allow={["mentor"]}>
      <MentorMatchesList query={query} user={user} />
    </RoleGuard>
  );
}
