import { StyledCollectPage } from "../../../styles/StyledBuilder";

import Navigation from "../Navigation/Main";
import ParticipantPage from "./Participant/Main";
import Table from "./Participants/Table";

export default function Collect({ query, user, tab, toggleSidebar }) {
  const studyId = query?.selector;
  const participantId = query?.id;

  if (!studyId) {
    return <div>No study found, please save your study first.</div>;
  }

  return (
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
      <StyledCollectPage>
        {participantId ? (
          <ParticipantPage
            query={query}
            studyId={studyId}
            participantId={participantId}
          />
        ) : (
          <div className="collectBoard">
            <Table studyId={studyId} />
          </div>
        )}
      </StyledCollectPage>
    </>
  );
}
