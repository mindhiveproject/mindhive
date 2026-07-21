import StudyDescription from "./Description";
import StudyTagger from "../../../../Tag/StudyTagger";
import StudyStatus from "./Status";
import StudyVersion from "./Version";

export default function Settings(props) {
  return (
    <div className="studySettings">
      <section className="settingsCard">
        <StudyStatus {...props} />
      </section>
      <section className="settingsCard">
        <StudyVersion {...props} />
      </section>
      <section className="settingsCard">
        <StudyDescription {...props} />
      </section>
      <section className="settingsCard">
        <StudyTagger {...props} />
      </section>
    </div>
  );
}
