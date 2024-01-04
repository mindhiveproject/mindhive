import { useMutation } from "@apollo/client";
import { DELETE_VIZSECTION } from "../../../../Mutations/VizSection";
import { STUDY_VIZJOURNAL } from "../../../../Queries/VizJournal";

export default function DeleteSection({ studyId, sectionId }) {
  const [deleteSection, { data, loading, error }] = useMutation(
    DELETE_VIZSECTION,
    {
      variables: {
        id: sectionId,
      },
      refetchQueries: [{ query: STUDY_VIZJOURNAL, variables: { id: studyId } }],
    }
  );

  return (
    <div>
      <button onClick={deleteSection}>Delete</button>
    </div>
  );
}
