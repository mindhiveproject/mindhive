import moment from "moment";

export default function ParticipantInformation({ study, participant, type }) {
  const studyInfo =
    (participant?.studiesInfo && participant?.studiesInfo[study?.id]) || {};
  const generalInfo = participant?.generalInfo || {};

  return (
    <div>
      <div className="infoItem">
        <p>Participant ID</p>
        <p>{participant?.publicId}</p>
      </div>
      <div className="infoItem">
        <p>Public readable ID</p>
        <p>{participant?.publicReadableId}</p>
      </div>

      <h2>Study-related information</h2>
      <div>
        {Object.keys(generalInfo).map((key) => {
          if (key === "eng") {
            return (
              <div className="infoItem" key={key}>
                <p>Do you understand basic instruction written in English?</p>
                <p>{generalInfo[key] === "yes" ? "Yes" : "No"}</p>
              </div>
            );
          }
          if (key === "blockName") {
            return (
              <div className="infoItem" key={key}>
                <p>Between-subject condition</p>
                <p>{generalInfo[key]}</p>
              </div>
            );
          }
          if (key === "share") {
            return (
              <div className="infoItem" key={key}>
                <p>Agreed to save information for future studies</p>
                <p>{generalInfo[key] === "true" ? "Yes" : "No"}</p>
              </div>
            );
          }
          if (key === "zip" && generalInfo.zip) {
            return (
              <div className="infoItem" key={key}>
                <p>Zip code</p>
                <p>{generalInfo[key]}</p>
              </div>
            );
          }
          if (key === "bd" && generalInfo.bd) {
            return (
              <div className="infoItem" key={key}>
                <p>Birthday</p>
                <p>
                  {moment(parseInt(generalInfo[key])).format("MMMM D, YYYY")}
                </p>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
