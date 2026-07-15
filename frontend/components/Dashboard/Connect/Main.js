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
import ReviewQueueMain from "./ReviewQueue/Main";
import ReviewOpportunityMain from "./ReviewOpportunity/Main";
import ClassNetworksMain from "./ClassNetworks/Main";
import ConnectNavigationBar from "./ConnectNavigationBar";

export default function ConnectMain({ query, user }) {
  const { selector } = query;

  let content;

  if (selector === "my") {
    content = <Connections query={query} user={user} />;
  } else if (selector === "with") {
    content = <ProfilePage query={query} user={user} />;
  } else if (selector === "opportunities") {
    content = <OpportunitiesMain query={query} user={user} />;
  } else if (selector === "rounds") {
    content = <RoundsMain query={query} user={user} />;
  } else if (selector === "questions") {
    content = <QuestionsMain query={query} user={user} />;
  } else if (selector === "participate") {
    content = <ParticipateMain query={query} user={user} />;
  } else if (selector === "matches") {
    content = <MatchesMain query={query} user={user} />;
  } else if (selector === "my-matches") {
    content = <MentorMatchesMain query={query} user={user} />;
  } else if (selector === "explore") {
    content = <ExploreMain query={query} user={user} />;
  } else if (selector === "organizations") {
    content = <OrganizationsMain query={query} user={user} />;
  } else if (selector === "networks") {
    content = <ClassNetworksMain query={query} user={user} />;
  } else if (selector === "review-queue") {
    content = <ReviewQueueMain />;
  } else if (selector === "review") {
    content = <ReviewOpportunityMain query={query} />;
  } else {
    content = <ConnectBank query={query} user={user} />;
  }

  return (
    <>
      <ConnectNavigationBar />
      <main id="connect-main">{content}</main>
    </>
  );
}
