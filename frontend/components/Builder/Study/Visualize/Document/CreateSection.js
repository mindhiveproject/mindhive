import { useMutation } from "@apollo/client";
import { CREATE_VIZSECTION } from "../../../../Mutations/VizSection";
import { STUDY_VIZJOURNAL } from "../../../../Queries/VizJournal";

export default function CreateSection({ studyId, chapterId }) {
  const [createSection, { data, loading, error }] = useMutation(
    CREATE_VIZSECTION,
    {
      variables: {
        input: {
          title: "Test viz section title",
          type: "PARAGRAPH",
          vizChapter: {
            connect: {
              id: chapterId,
            },
          },
        },
      },
      refetchQueries: [{ query: STUDY_VIZJOURNAL, variables: { id: studyId } }],
    }
  );

  return (
    <div>
      <button onClick={createSection}>+ Paragraph</button>
    </div>
  );
}
