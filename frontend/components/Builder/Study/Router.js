import Proposal from "./Proposal/Main";
import ParticipantPage from "./ParticipantPage/Main";
import Builder from "./Builder/Main";
import Review from "./Review/Main";
import Collect from "./Collect/Main";
import Visualize from "./Visualize/Main";
import VisualizeOld from "./Visualize_old/Main";

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
    if (
      user?.permissions?.map((p) => p?.name).includes("ADMIN") ||
      user?.permissions?.map((p) => p?.name).includes("TEACHER") ||
      user?.permissions?.map((p) => p?.name).includes("MENTOR") ||
      user?.permissions?.map((p) => p?.name).includes("SCIENTIST")
    ) {
      return (
        <Visualize
          query={query}
          user={user}
          tab={tab}
          toggleSidebar={toggleSidebar}
        />
      );
    } else {
      return (
        <VisualizeOld
          query={query}
          user={user}
          tab={tab}
          toggleSidebar={toggleSidebar}
        />
      );
    }
  }
}
