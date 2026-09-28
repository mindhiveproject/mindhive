import ProjectBoard from "./Project/ProjectBoard/Main";
import ParticipantPage from "./Project/ParticipantPage/Main";
import Builder from "./Project/Builder/Main";
import Collect from "./Project/Collect/Wrapper";
import DataJournals from "./Project/DataJournal/Main";
import Proposal from "./Study/Proposal/Main";
import { isProjectArea } from "./shared/identity";

export default function TabRouter({ query, user, tab }) {
  if (tab === "board") {
    if (!isProjectArea(query?.area)) {
      return <Proposal query={query} user={user} tab={tab} />;
    }
    return <ProjectBoard query={query} user={user} tab={tab} />;
  }

  if (tab === "proposal") {
    return <Proposal query={query} user={user} tab={tab} />;
  }

  if (tab === "builder") {
    return <Builder query={query} user={user} tab={tab} />;
  }

  if (tab === "page") {
    return <ParticipantPage query={query} user={user} tab={tab} />;
  }

  if (tab === "collect") {
    return <Collect query={query} user={user} tab={tab} />;
  }

  if (tab === "journal") {
    return <DataJournals user={user} query={query} tab={tab} />;
  }

  return null;
}
