import StudyDescription from "./Description";
import StudyTagger from "../../../../Tag/StudyTagger";
import StudyStatus from "./Status";
import StudyVersion from "./Version";

export default function Settings(props) {
  return (
    <div className="studySettings">
      <div className="card">
        <StudyStatus {...props} />
      </div>
      <div className="card">
        <StudyVersion {...props} />
      </div>
      <div className="card">
        <StudyDescription {...props} />
      </div>
      <div className="card">
        <StudyTagger {...props} />
      </div>
    </div>
  );
}
