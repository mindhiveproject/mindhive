import { DropdownItem } from "semantic-ui-react";

import { useMutation } from "@apollo/client";
import { DELETE_VIZSECTION } from "../../../../Mutations/VizSection";
import { STUDY_VIZJOURNAL } from "../../../../Queries/VizJournal";

export default function DeleteSection({ studyId, sectionId }) {
  const [deleteSection, { data, loading, error }] = useMutation(
    DELETE_VIZSECTION,
    {
      variables: {
        id: sectionId,
      },
      refetchQueries: [{ query: STUDY_VIZJOURNAL, variables: { id: studyId } }],
    }
  );

  return (
    <DropdownItem onClick={deleteSection}>
      <div className="menuItem">
        <img src={`/assets/icons/visualize/delete.svg`} />
        <div>Delete</div>
      </div>
    </DropdownItem>
  );
}
