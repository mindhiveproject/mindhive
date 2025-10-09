// Delete VizChapter (which is Workspace in the UI)

import { DropdownItem } from "semantic-ui-react";

import { useMutation } from "@apollo/client";
import { DELETE_VIZSECTION } from "../../../../Mutations/VizSection";
import { DELETE_VIZCHAPTER } from "../../../../Mutations/VizChapter";

import { GET_DATA_JOURNAL } from "../../../../Queries/DataJournal";

export default function DeleteWorkspace({
  journal,
  workspace,
  selectWorkspace,
}) {
  const [
    deleteComponent,
    {
      data: deleteComponentData,
      loading: deleteComponentLoading,
      error: deleteComponentError,
    },
  ] = useMutation(DELETE_VIZSECTION, {
    variables: {},
  });

  const [deleteWorkspace, { data, loading, error }] = useMutation(
    DELETE_VIZCHAPTER,
    {
      variables: {},
      refetchQueries: [
        {
          query: GET_DATA_JOURNAL,
          variables: {
            id: journal?.id,
          },
        },
      ],
    }
  );

  const deleteWorkspaceAndComponents = async () => {
    // delete all sections in this workspace
    workspace?.vizSections.forEach(async (section) => {
      await deleteComponent({
        variables: {
          id: section?.id,
        },
      });
    });
    // delete the workspace
    await deleteWorkspace({ variables: { id: workspace?.id } });
    // de-select the workspace
    await selectWorkspace({
      journalId: journal?.id,
      workspaceId: undefined,
    });
  };

  return (
    <DropdownItem
      onClick={() => {
        if (
          confirm(
            "Are you sure you want to delete this workspace? All components in this workspace will be deleted as well."
          )
        ) {
          deleteWorkspaceAndComponents();
        }
      }}
    >
      <div className="menuItem">
        <img src={`/assets/icons/visualize/delete.svg`} />
        <div>Delete</div>
      </div>
    </DropdownItem>
  );
}
