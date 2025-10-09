import { useMutation } from "@apollo/client";

import { CREATE_VIZJOURNAL } from "../../../../Mutations/VizJournal";
import { ADD_VIZPART } from "../../../../Mutations/VizPart";
import { GET_DATA_JOURNALS } from "../../../../Queries/DataArea";

export default function CreateJournal({
  projectId,
  studyId,
  createNewJournalCollection,
  journalCollections,
}) {
  const [createJournal, { data, loading, error }] = useMutation(
    CREATE_VIZJOURNAL,
    {
      refetchQueries: [
        {
          query: GET_DATA_JOURNALS,
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
    }
  );

  const [
    createPart,
    {
      data: createPartData,
      loading: createPartLoading,
      error: createPartError,
    },
  ] = useMutation(ADD_VIZPART, {
    refetchQueries: [
      {
        query: GET_DATA_JOURNALS,
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

  const addNewJournalToExistingCollection = () => {
    const journalCollection = journalCollections[0];
    createPart({
      variables: {
        input: {
          title: "Unnamed journal",
          vizChapters: {
            create: [{ title: "Unnamed workspace", description: "" }],
          },
          vizJournal: {
            connect: {
              id: journalCollection?.id,
            },
          },
        },
      },
    });
  };

  const initializeJournalCollectionWithJournalAndWorkspace = () => {
    createJournal({
      variables: {
        input: {
          title: "Unnamed journal collection",
          project: projectId
            ? {
                connect: {
                  id: projectId,
                },
              }
            : null,
          study: studyId
            ? {
                connect: {
                  id: studyId,
                },
              }
            : null,
          vizParts: {
            create: [
              {
                title: "Unnamed journal",
                vizChapters: {
                  create: [
                    {
                      title: "Unnamed workspace",
                      description: "",
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    });
  };

  const addNewJournal = () => {
    if (createNewJournalCollection) {
      initializeJournalCollectionWithJournalAndWorkspace();
    } else {
      addNewJournalToExistingCollection();
    }
  };

  return (
    <div className="menuButton" onClick={() => addNewJournal()}>
      Create new journal
    </div>
  );
}
