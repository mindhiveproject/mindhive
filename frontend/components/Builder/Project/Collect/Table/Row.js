import moment from "moment";
import "moment-duration-format";
import Link from "next/link";
import ChangeDatasetStatuses from "./ChangeStatuses";
import useTranslation from "next-translate/useTranslation";

export default function Row({ studyId, participant, consents, type }) {
  const { t } = useTranslation("builder");
  const studyInfo = (participant?.studiesInfo &&
    participant?.studiesInfo[studyId]) || { info: { path: [] } };
  const { info } = studyInfo;
  const { path } = info;

  const generalInfo =
    { ...participant?.generalInfo, ...participant?.info } || {};
  const consentDecisions = consents
    .map((consent) => {
      return generalInfo?.[`consent-${consent?.id}`];
    })
    .join(", ");

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

  // Compute duration
  // Get the event timestamps
  const timestampsRun = path.map((p) => p?.timestampRun).filter((t) => !!t);
  const timestampsFinished = path
    .map((p) => p?.timestampFinished)
    .filter((t) => !!t);
  const timestamps = [...timestampsRun, ...timestampsFinished];
  // Find the minimum and maximum values
  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);
  // Calculate the difference
  const difference = maxTimestamp - minTimestamp;
  const duration = moment.duration(difference, "milliseconds");
  const formattedDuration = duration.format("h:mm:ss", { trim: false });

  // Optionally translate participant type if present
  const participantType = participant?.type
    ? t(`participantType.${participant.type.toLowerCase()}`, participant.type)
    : "";

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
      <div>{timestamps.length > 1 ? formattedDuration : ""}</div>
      <div>
        {
          participant?.datasets?.filter(
            (dataset) => dataset?.isCompleted && dataset?.study?.id === studyId
          ).length
        }
      </div>
      <div>{condition}</div>
      <div>{consentDecisions}</div>

      <div>{participantType}</div>
      <ChangeDatasetStatuses
        studyId={studyId}
        participantId={participant?.publicId}
        datasets={participant?.datasets}
        type={type}
      />
    </div>
  );
}
