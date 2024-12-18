import { DropdownItem } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import { UPDATE_VIZSECTION } from "../../../../Mutations/VizSection";
import { STUDY_VIZJOURNAL } from "../../../../Queries/VizJournal";

export default function RenameSection({ studyId, sectionId }) {
  const [renameSection, { data, loading, error }] = useMutation(
    UPDATE_VIZSECTION,
    {
      onError: (error) => {
        console.error("Mutation error:", error);
      },
      refetchQueries: [{ query: STUDY_VIZJOURNAL, variables: { id: studyId } }],
      awaitRefetchQueries: true,
    }
  );

  const getNewTitle = async () => {
    const input = prompt(
      "\nCareful, before renaming you section, make sure that it has been saved!\n\nProvide a new section title:"
    );
    if (input !== null) {
      try {
        await renameSection({
          variables: {
            id: sectionId,
            input: {
              title: input,
            },
          },
        });
      } catch (error) {
        console.error("Failed to rename section:", error);
      }
    }
  };

  return (
    <DropdownItem onClick={getNewTitle}>
      <div className="menuItem">
        <img src={`/assets/icons/visualize/edit.svg`} alt="Edit Icon" />
        <div>Rename</div>
      </div>
    </DropdownItem>
  );
}
