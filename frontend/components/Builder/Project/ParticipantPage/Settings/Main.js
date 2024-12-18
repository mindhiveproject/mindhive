import Parameters from "./Parameters";
import ShareStudy from "./Share";

export default function Settings({
  user,
  study,
  handleChange,
  handleMultipleUpdate,
}) {
  return (
    <div className="settings">
      <ShareStudy study={study} handleChange={handleChange} />
      <Parameters
        user={user}
        study={study}
        handleChange={handleChange}
        handleMultipleUpdate={handleMultipleUpdate}
      />
    </div>
  );
}
