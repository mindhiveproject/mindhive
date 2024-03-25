import { useMutation } from "@apollo/client";

import { ADD_VIZCHAPTER } from "../../../../../Mutations/VizChapter";
import { STUDY_VIZJOURNAL } from "../../../../../Queries/VizJournal";

export default function CreateChapter({ studyId, part }) {
  const [addChapter, { data, loading, error }] = useMutation(ADD_VIZCHAPTER, {
    variables: {
      input: {
        title: "Unnamed chapter",
        description: "Description",
        vizPart: {
          connect: {
            id: part?.id,
          },
        },
      },
    },
    refetchQueries: [{ query: STUDY_VIZJOURNAL, variables: { id: studyId } }],
  });
  return (
    <div className="menuItem" onClick={addChapter}>
      <img src={`/assets/icons/visualize/add.svg`} />
    </div>
  );
}
