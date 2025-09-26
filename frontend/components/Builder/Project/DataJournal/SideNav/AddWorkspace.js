import { useMutation } from "@apollo/client";

import { ADD_VIZCHAPTER } from "../../../../Mutations/VizChapter";
import { GET_DATA_JOURNAL } from "../../../../Queries/DataJournal";

export default function AddWorkspace({ journalId }) {
  const [addChapter, { data, loading, error }] = useMutation(ADD_VIZCHAPTER, {
    variables: {
      input: {
        title: "Unnamed workspace",
        vizPart: {
          connect: {
            id: journalId,
          },
        },
      },
    },
    refetchQueries: [
      {
        query: GET_DATA_JOURNAL,
        variables: {
          id: journalId,
        },
      },
    ],
  });
  return (
    <div className="addNewChapter" onClick={addChapter}>
      + Add Workspace
    </div>
  );
}
