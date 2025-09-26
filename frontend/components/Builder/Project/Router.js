import ProjectBoard from "./ProjectBoard/Main";
import ParticipantPage from "./ParticipantPage/Main";
import Builder from "./Builder/Main";
import Review from "./Review/Main";
import Collect from "./Collect/Wrapper";
import Visualize from "./Visualize/Wrapper";
import DataJournals from "./DataJournal/Main";

export default function Router({ query, user, tab, toggleSidebar }) {
  if (tab === "board") {
    return (
      <ProjectBoard
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

  if (tab === "journal") {
    return (
      <DataJournals
        user={user}
        query={query}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
    );
  }
}
