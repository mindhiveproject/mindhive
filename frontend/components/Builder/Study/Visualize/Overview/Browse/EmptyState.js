import { useMutation } from "@apollo/client";

import { CREATE_VIZJOURNAL } from "../../../../../Mutations/VizJournal";
import { STUDY_VIZJOURNAL } from "../../../../../Queries/VizJournal";

export default function EmptyState({ studyId }) {
  const [createJournal, { data, loading, error }] = useMutation(
    CREATE_VIZJOURNAL,
    {
      variables: {
        input: {
          title: "Unnamed journal",
          study: {
            connect: {
              id: studyId,
            },
          },
          vizParts: {
            create: [
              {
                title: "Unnamed part",
                dataOrigin: "STUDY",
                vizChapters: {
                  create: [
                    { title: "Unnamed chapter", description: "Description" },
                  ],
                },
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
      <div className="emptyStateButtons">
        <div className="menuItem menuButton" onClick={createJournal}>
          <img src={`/assets/icons/visualize/draft.svg`} />
          <div>From scratch</div>
        </div>
      </div>
    </div>
  );
}
