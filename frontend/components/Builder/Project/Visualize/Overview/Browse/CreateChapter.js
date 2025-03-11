import { useMutation } from "@apollo/client";

import { ADD_VIZCHAPTER } from "../../../../../Mutations/VizChapter";
import { GET_VIZJOURNALS } from "../../../../../Queries/VizJournal";

export default function CreateChapter({ projectId, studyId, part }) {
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
    refetchQueries: [
      {
        query: GET_VIZJOURNALS,
        variables: {
          where:
            projectId && studyId
              ? {
                  OR: [
                    { project: { id: { equals: projectId } } },
                    { study: { id: { equals: studyId } } },
                  ],
                }
              : projectId
              ? { project: { id: { equals: projectId } } }
              : studyId
              ? { study: { id: { equals: studyId } } }
              : null,
        },
      },
    ],
  });
  return (
    <div className="menuItem" onClick={addChapter}>
      <img src={`/assets/icons/visualize/add.svg`} />
    </div>
  );
}
