import { DropdownItem } from "semantic-ui-react";

import { useMutation } from "@apollo/client";
import { DELETE_VIZPART } from "../../../../Mutations/VizPart";

import { STUDY_VIZJOURNAL } from "../../../../Queries/VizJournal";

export default function DeleteChapter({ studyId, part }) {
  const [deletePart, { data: deletePartData }] = useMutation(DELETE_VIZPART, {
    variables: {},
    refetchQueries: [{ query: STUDY_VIZJOURNAL, variables: { id: studyId } }],
  });

  const deleteVizPart = async () => {
    // TO DO delete all chapters and sections inside of the part
    // console.log({ part });

    // delete the part
    await deletePart({ variables: { id: part?.id } });
  };

  return (
    <DropdownItem onClick={deleteVizPart}>
      <div className="menuItem">
        <img src={`/assets/icons/visualize/delete.svg`} />
        <div>Delete</div>
      </div>
    </DropdownItem>
  );
}
