import { useMutation } from "@apollo/client";
import { Icon } from "semantic-ui-react";
import { CREATE_VIZJOURNAL } from "../../../../../Mutations/VizJournal";
import { STUDY_VIZJOURNAL } from "../../../../../Queries/VizJournal";

export default function EmptyState({ studyId }) {
  const [createJournal, { data, loading, error }] = useMutation(
    CREATE_VIZJOURNAL,
    {
      variables: {
        input: {
          title: "Test viz journal",
          study: {
            connect: {
              id: studyId,
            },
          },
          vizParts: {
            create: [
              {
                title: "Test viz part",
                dataOrigin: "STUDY",
                vizChapters: { create: [{ title: "Test viz chapter" }] },
              },
            ],
          },
        },
      },
      refetchQueries: [{ query: STUDY_VIZJOURNAL, variables: { id: studyId } }],
    }
  );

  return (
    <div>
      <div>It looks like you still don’t have any data visualizations!</div>
      <div>
        <button onClick={createJournal}>From scratch</button>
      </div>
    </div>
  );
}
