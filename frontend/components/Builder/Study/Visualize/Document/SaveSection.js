import { useMutation } from "@apollo/client";
import { UPDATE_VIZSECTION } from "../../../../Mutations/VizSection";
import { STUDY_VIZJOURNAL } from "../../../../Queries/VizJournal";

export default function SaveSection({ studyId, sectionId, inputs }) {
  const [updateSection, { data, loading, error }] = useMutation(
    UPDATE_VIZSECTION,
    {
      variables: {
        id: sectionId,
        input: {
          content: { ...inputs },
        },
      },
      refetchQueries: [{ query: STUDY_VIZJOURNAL, variables: { id: studyId } }],
    }
  );

  return (
    <div>
      <button onClick={updateSection}>Save</button>
    </div>
  );
}
