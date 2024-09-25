import EditProfile from "./EditProfile";
import SetAvailability from "./SetAvailability";

export default function ProfileRouter({ query, user }) {
  const { selector } = query;

  if (selector === "edit") {
    return <EditProfile query={query} user={user} />;
  }

  if (selector === "set") {
    return <SetAvailability query={query} user={user} />;
  }
  return <div></div>;
}
