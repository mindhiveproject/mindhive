import MilestoneStatusModal from "./MilestoneStatusModal";

export default function StudySubmissionStatusManager({ value, openForParticipation, ...rest }) {
  return (
    <MilestoneStatusModal {...rest} status={value} initiallyOpen={openForParticipation} />
  );
}
