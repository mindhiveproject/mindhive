import ConnectBank from "./Bank/Main";
import Connections from "./Connections/Main";
import ProfilePage from "./ProfilePage/Main";
import OpportunitiesMain from "./Opportunities/Main";
import RoundsMain from "./Rounds/Main";
import QuestionsMain from "./Questions/Main";
import ParticipateMain from "./Participate/Main";
import MatchesMain from "./Matches/Main";
import MentorMatchesMain from "./MentorMatches/Main";
import ExploreMain from "./Explore/Main";
import OrganizationsMain from "./Organizations/Main";

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

  if (selector === "my-matches") {
    return <MentorMatchesMain query={query} user={user} />;
  }

  if (selector === "explore") {
    return <ExploreMain query={query} user={user} />;
  }

  if (selector === "organizations") {
    return <OrganizationsMain query={query} user={user} />;
  }

  return <ConnectBank query={query} user={user} />;
}
