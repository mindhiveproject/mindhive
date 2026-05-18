import ConnectBank from "./Bank/Main";
import Connections from "./Connections/Main";
import ProfilePage from "./ProfilePage/Main";
import OpportunitiesMain from "./Opportunities/Main";
import RoundsMain from "./Rounds/Main";
import QuestionsMain from "./Questions/Main";
import ParticipateMain from "./Participate/Main";
import MatchesMain from "./Matches/Main";

export default function ConnectMain({ query, user }) {
  const { selector } = query;

  if (selector === "my") {
    return <Connections query={query} user={user} />;
  }

  if (selector === "with") {
    return <ProfilePage query={query} user={user} />;
  }

  if (selector === "opportunities") {
    return <OpportunitiesMain query={query} user={user} />;
  }

  if (selector === "rounds") {
    return <RoundsMain query={query} user={user} />;
  }

  if (selector === "questions") {
    return <QuestionsMain query={query} user={user} />;
  }

  if (selector === "participate") {
    return <ParticipateMain query={query} user={user} />;
  }

  if (selector === "matches") {
    return <MatchesMain query={query} user={user} />;
  }

  return <ConnectBank query={query} user={user} />;
}
