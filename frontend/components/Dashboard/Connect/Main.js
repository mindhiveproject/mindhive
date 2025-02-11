import ConnectBank from "./Bank/Main";
import Connections from "./Connections/Main";
import ProfilePage from "./ProfilePage/Main";

export default function ConnectMain({ query, user }) {
  const { selector } = query;

  if (selector === "my") {
    return <Connections query={query} user={user} />;
  }

  if (selector === "with") {
    return <ProfilePage query={query} user={user} />;
  }

  return <ConnectBank query={query} user={user} />;
}
