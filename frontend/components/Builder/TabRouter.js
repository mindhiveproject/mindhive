import ProjectBoard from "./Project/ProjectBoard/Main";
import ParticipantPage from "./Project/ParticipantPage/Main";
import Builder from "./Project/Builder/Main";
import Collect from "./Project/Collect/Wrapper";
import DataJournals from "./Project/DataJournal/Main";
import Proposal from "./Study/Proposal/Main";
import { isProjectArea } from "./shared/identity";

export default function TabRouter({ query, user, tab, toggleSidebar }) {
  if (tab === "board") {
    if (!isProjectArea(query?.area)) {
      return (
        <Proposal
          query={query}
          user={user}
          tab={tab}
          toggleSidebar={toggleSidebar}
        />
      );
    }
    return (
      <ProjectBoard
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
    );
  }

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

  return null;
}
