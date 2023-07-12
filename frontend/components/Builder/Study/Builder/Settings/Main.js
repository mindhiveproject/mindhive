import StudyDescription from "./Description";

export default function Settings(props) {
  return (
    <>
      <div className="card">
        <StudyDescription {...props} />
      </div>
      {/* <div className="card">
        <StudyTagger {...props} />
      </div> */}
    </>
  );
}
