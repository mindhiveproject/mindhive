import { DropdownItem } from "semantic-ui-react";

import { useMutation } from "@apollo/client";
import { DELETE_VIZSECTION } from "../../../../Mutations/VizSection";
import { GET_VIZJOURNALS } from "../../../../Queries/VizJournal";

export default function DeleteSection({ projectId, studyId, sectionId }) {
  const [deleteSection, { data, loading, error }] = useMutation(
    DELETE_VIZSECTION,
    {
      variables: {
        id: sectionId,
      },
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
