import moment from "moment";
import Link from "next/link";
import ChangeDatasetStatuses from "./ChangeStatuses";

export default function Row({ studyId, participant, type }) {
  const studyInfo = (participant?.studiesInfo &&
    participant?.studiesInfo[studyId]) || { info: { path: [] } };
  const { info } = studyInfo;
  const { path } = info;

  // when the participant started participating in the study
  let started;
  // which conditions was the participant assigned to
  let condition;
  if (path.length) {
    started = path[0]?.timestampFinished;
    condition = path
      .filter((stage) => stage?.conditionLabel)
      .map((stage) => stage?.conditionLabel)
      .join(", ");
  }

  return (
    <div className="tableRow">
      <Link
        href={{
          pathname: `/builder/studies`,
          query: {
            selector: studyId,
            tab: `collect`,
            id: participant?.publicId,
            type: participant?.type?.toLowerCase(),
          },
        }}
      >
        <div>
          <a>{participant?.publicId}</a>
        </div>
      </Link>

      <div>{participant?.publicReadableId}</div>
      <div>{started && moment(started).format("MMMM D, YY, h:mm:ss")}</div>

      <div>
        {
          participant?.datasets?.filter((dataset) => dataset?.isCompleted)
            .length
        }
      </div>
      <div>{condition}</div>
      <div></div>

      <div>{participant?.type}</div>
      <ChangeDatasetStatuses
        participantId={participant?.publicId}
        datasets={participant?.datasets}
        type={type}
      />
    </div>
  );
}
