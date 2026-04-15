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
 * @param {{ projectId?: string, studyId?: string, part: { id?: string }, t: (key: string, query?: object, options?: { default?: string }) => string }} args
 */
export function useDeleteJournal({ projectId, studyId, part, t }) {
  const [deletePart, { loading: deleting }] = useMutation(DELETE_VIZPART, {
    variables: {},
    refetchQueries: refetchQueriesForJournal(projectId, studyId),
    awaitRefetchQueries: true,
  });

  const runDeleteJournal = useCallback(async () => {
    if (!part?.id) {
      return {
        ok: false,
        message: t(
          "dataJournal.sideNav.deleteJournalMissingId",
          {},
          { default: "This journal cannot be deleted (missing id)." },
        ),
      };
    }
    try {
      const result = await deletePart({ variables: { id: part.id } });
      const gqlErrors = result?.errors;
      if (gqlErrors?.length) {
        return {
          ok: false,
          message: gqlErrors.map((e) => e.message).join("\n"),
        };
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        message: err?.message ?? String(err),
      };
    }
  }, [deletePart, part?.id, t]);

  return { runDeleteJournal, deleting };
}
