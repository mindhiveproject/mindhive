import { StyledCollectPage } from "../../../styles/StyledBuilder";

import Table from "./Participants/Table";

export default function Collect({
  query,
  user,
  study,
  handleChange,
  handleMultipleUpdate,
}) {
  if (!study?.id) {
    return <div>No study found, please save your study first.</div>;
  }

  return (
    <StyledCollectPage>
      <div className="collectBoard">
        <Table study={study} />
      </div>
    </StyledCollectPage>
  );
}
