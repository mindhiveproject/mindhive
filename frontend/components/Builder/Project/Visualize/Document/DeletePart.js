import { DropdownItem } from "semantic-ui-react";

import { useMutation } from "@apollo/client";
import { DELETE_VIZPART } from "../../../../Mutations/VizPart";

import { GET_VIZJOURNALS } from "../../../../Queries/VizJournal";

export default function DeleteChapter({ projectId, studyId, part }) {
  const [deletePart, { data: deletePartData }] = useMutation(DELETE_VIZPART, {
    variables: {},
    refetchQueries: [
      {
        query: GET_VIZJOURNALS,
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

  const deleteVizPart = async () => {
    // TO DO delete all chapters and sections inside of the part

    // delete the part
    await deletePart({ variables: { id: part?.id } });
  };

  return (
    <DropdownItem
      onClick={() => {
        if (
          confirm(
            "Are you sure you want to delete this part? All sections in this part will be deleted as well."
          )
        ) {
          deleteVizPart().catch((err) => {
            alert(err.message);
          });
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
