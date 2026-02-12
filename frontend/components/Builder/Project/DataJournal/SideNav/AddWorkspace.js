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

  if (loading) return <div>Adding...</div>;
  if (error) return <div>Error adding workspace</div>;

  return (
    <div className="addNewChapter" onClick={addChapter}>
      + Add Workspace
    </div>
  );
}
