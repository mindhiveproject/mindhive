import MilestoneStatusModal from "./MilestoneStatusModal";

export default function SubmissionStatusManager({ value, openForComments, ...rest }) {
  return (
    <MilestoneStatusModal {...rest} status={value} initiallyOpen={openForComments} />
  );
}
