// Delete VizChapter (which is Workspace in the UI)

import { useCallback, useState } from "react";
import { useApolloClient, useMutation } from "@apollo/client";

import { DELETE_VIZSECTION } from "../../../../Mutations/VizSection";
import { DELETE_VIZCHAPTER } from "../../../../Mutations/VizChapter";
import { GET_DATA_JOURNAL } from "../../../../Queries/DataJournal";

/**
 * @param {{
 *   journal: { id?: string },
 *   workspace: { id?: string, vizSections?: Array<{ id?: string }> },
 *   t: (key: string, query?: object, options?: { default?: string }) => string,
 *   onDeleted?: () => void,
 * }} args
 */
export function useDeleteWorkspace({ journal, workspace, t, onDeleted }) {
  const client = useApolloClient();
  const [deleting, setDeleting] = useState(false);

  const [deleteComponent] = useMutation(DELETE_VIZSECTION, {
    variables: {},
  });

  const [deleteWorkspaceMut] = useMutation(DELETE_VIZCHAPTER, {
    variables: {},
    refetchQueries: [
      {
        query: GET_DATA_JOURNAL,
        variables: {
          id: journal?.id,
        },
      },
    ],
    awaitRefetchQueries: true,
  });

  const runDeleteWorkspace = useCallback(async () => {
    if (!workspace?.id) {
      return {
        ok: false,
        message: t(
          "dataJournal.sideNav.deleteWorkspaceMissingId",
          {},
          { default: "This workspace cannot be deleted (missing id)." },
        ),
      };
    }

    setDeleting(true);
    try {
      const sections = workspace?.vizSections || [];
      for (const section of sections) {
        if (section?.id) {
          const sectionResult = await deleteComponent({
            variables: { id: section.id },
          });
          if (sectionResult.errors?.length) {
            return {
              ok: false,
              message: sectionResult.errors.map((e) => e.message).join("\n"),
            };
          }
        }
      }

      const result = await deleteWorkspaceMut({
        variables: { id: workspace.id },
      });
      if (result.errors?.length) {
        return {
          ok: false,
          message: result.errors.map((e) => e.message).join("\n"),
        };
      }

      const deletedId = result.data?.deleteVizChapter?.id;
      if (deletedId) {
        const cacheId = client.cache.identify({
          __typename: "VizChapter",
          id: deletedId,
        });
        if (cacheId) {
          client.cache.evict({ id: cacheId });
          client.cache.gc();
        }
      }

      onDeleted?.();
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        message: err?.message ?? String(err),
      };
    } finally {
      setDeleting(false);
    }
  }, [
    client,
    deleteComponent,
    deleteWorkspaceMut,
    journal?.id,
    onDeleted,
    t,
    workspace?.id,
    workspace?.vizSections,
  ]);

  return { runDeleteWorkspace, deleting };
}
