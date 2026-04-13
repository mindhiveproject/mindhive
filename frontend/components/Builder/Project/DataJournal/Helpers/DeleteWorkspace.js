// Delete VizChapter (which is Workspace in the UI)

import { useCallback } from "react";
import { useMutation } from "@apollo/client";

import { DELETE_VIZSECTION } from "../../../../Mutations/VizSection";
import { DELETE_VIZCHAPTER } from "../../../../Mutations/VizChapter";
import { GET_DATA_JOURNAL } from "../../../../Queries/DataJournal";

/**
 * @param {{
 *   journal: { id?: string },
 *   workspace: { id?: string, vizSections?: Array<{ id?: string }> },
 *   t: (k: string, f: string) => string,
 *   onDeleted?: () => void,
 * }} args
 */
export function useDeleteWorkspace({ journal, workspace, t, onDeleted }) {
  const [deleteComponent] = useMutation(DELETE_VIZSECTION, {
    variables: {},
  });

  const [deleteWorkspace] = useMutation(DELETE_VIZCHAPTER, {
    variables: {},
    refetchQueries: [
      {
        query: GET_DATA_JOURNAL,
        variables: {
          id: journal?.id,
        },
      },
    ],
  });

  const confirmAndDelete = useCallback(() => {
    if (
      !window.confirm(
        t(
          "dataJournal.sideNav.deleteWorkspaceConfirm",
          "Are you sure you want to delete this workspace? All components in this workspace will be deleted as well.",
        ),
      )
    ) {
      return;
    }

    const run = async () => {
      const sections = workspace?.vizSections || [];
      for (const section of sections) {
        if (section?.id) {
          await deleteComponent({ variables: { id: section.id } });
        }
      }
      if (workspace?.id) {
        await deleteWorkspace({ variables: { id: workspace.id } });
      }
      onDeleted?.();
    };

    run().catch((err) => {
      window.alert(err.message);
    });
  }, [deleteComponent, deleteWorkspace, journal?.id, onDeleted, t, workspace?.id, workspace?.vizSections]);

  return { confirmAndDelete };
}
