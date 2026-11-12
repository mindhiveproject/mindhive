import SubmitStudyDialog from "./SubmitStudyDialog";
import { useStudyDataCollection } from "./useStudyDataCollection";

/**
 * SubmitStudyDialog that loads the study's state itself, for places that only
 * know the study id (the teacher's Studies tab). Closes once the action went
 * through.
 */
export default function StudyDataCollectionDialog({
  studyId,
  studyTitle,
  mode = "SUBMIT",
  userId,
  onClose,
}) {
  const { state, saving, run } = useStudyDataCollection(studyId);
  return (
    <SubmitStudyDialog
      open={!!state}
      mode={mode}
      studyTitle={studyTitle}
      state={state}
      userId={userId}
      saving={saving}
      onCancel={onClose}
      onConfirm={async (acknowledgedProfileIds) => {
        const done = await run(mode, {
          acknowledgedProfileIds,
          confirmed: true,
        });
        if (done) onClose?.();
      }}
    />
  );
}
