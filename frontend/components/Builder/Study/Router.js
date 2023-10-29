import Proposal from "./Proposal/Main";
import ParticipantPage from "./ParticipantPage/Main";
import Builder from "./Builder/Main";
import Review from "./Review/Main";
import Collect from "./Collect/Main";
import Visualize from "./Visualize/Main";

export default function Router({ query, user, tab, toggleSidebar }) {
  if (tab === "proposal") {
    return (
      <Proposal
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
    );
  }

  if (tab === "page") {
    return (
      <ParticipantPage
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
    );
  }

  if (tab === "builder") {
    return (
      <Builder
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
    );
  }

  if (tab === "review") {
    return (
      <Review
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
    );
  }

  if (tab === "collect") {
    return (
      <Collect
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
    );
  }

  if (tab === "visualize") {
    return (
      <Visualize
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
    );
  }
}
