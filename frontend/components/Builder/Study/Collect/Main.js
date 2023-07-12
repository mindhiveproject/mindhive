import { StyledCollectPage } from "../../../styles/StyledBuilder";

import Navigation from "../Navigation/Main";
import Table from "./Participants/Table";

export default function Collect({ query, user, tab }) {
  const studyId = query?.selector;

  if (!studyId) {
    return <div>No study found, please save your study first.</div>;
  }

  return (
    <>
      <Navigation query={query} user={user} tab={tab} />
      <StyledCollectPage>
        <div className="collectBoard">
          <Table studyId={studyId} />
        </div>
      </StyledCollectPage>
    </>
  );
}
