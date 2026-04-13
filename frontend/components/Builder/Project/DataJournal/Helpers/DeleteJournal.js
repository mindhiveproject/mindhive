// Delete VizPart (which is Journal in the UI)

import { useCallback } from "react";
import { useMutation } from "@apollo/client";

import { DELETE_VIZPART } from "../../../../Mutations/VizPart";
import { GET_DATA_JOURNALS } from "../../../../Queries/DataArea";

function refetchQueriesForJournal(projectId, studyId) {
  return [
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
  ];
}

/**
 * @param {{ projectId?: string, studyId?: string, part: { id?: string }, t: (k: string, f: string) => string }} args
 */
export function useDeleteJournal({ projectId, studyId, part, t }) {
  const [deletePart] = useMutation(DELETE_VIZPART, {
    variables: {},
    refetchQueries: refetchQueriesForJournal(projectId, studyId),
  });

  const confirmAndDelete = useCallback(() => {
    if (
      !window.confirm(
        t(
          "dataJournal.sideNav.deleteJournalConfirm",
          "Are you sure you want to delete this journal? All workspaces and components in this journal will be deleted as well.",
        ),
      )
    ) {
      return;
    }
    deletePart({ variables: { id: part?.id } }).catch((err) => {
      window.alert(err.message);
    });
  }, [deletePart, part?.id, t]);

  return { confirmAndDelete };
}
