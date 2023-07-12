import { StyledParticipantPage } from "../../../styles/StyledBuilder";
import Preview from "./Preview/Main";
import Settings from "./Settings/Main";

export default function ParticipantPage({
  user,
  study,
  handleChange,
  handleMultipleUpdate,
  captureFile,
  loading,
}) {
  return (
    <StyledParticipantPage>
      <Preview
        study={study}
        handleChange={handleChange}
        handleMultipleUpdate={handleMultipleUpdate}
        captureFile={captureFile}
      />
      <Settings
        user={user}
        study={study}
        handleChange={handleChange}
        handleMultipleUpdate={handleMultipleUpdate}
      />
    </StyledParticipantPage>
  );
}
