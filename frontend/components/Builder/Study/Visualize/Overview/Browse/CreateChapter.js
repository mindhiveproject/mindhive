import { DropdownItem } from "semantic-ui-react";

import { useMutation } from "@apollo/client";

import { ADD_VIZCHAPTER } from "../../../../../Mutations/VizChapter";
import { STUDY_VIZJOURNAL } from "../../../../../Queries/VizJournal";

export default function CreateChapter({ studyId, journal }) {
  const [addChapter, { data, loading, error }] = useMutation(ADD_VIZCHAPTER, {
    variables: {
      input: {
        title: "Unnamed chapter",
        description: "Description",
        vizPart: {
          connect: {
            id: journal?.vizParts[0]?.id,
          },
        },
      },
    },
    refetchQueries: [{ query: STUDY_VIZJOURNAL, variables: { id: studyId } }],
  });
  return (
    <DropdownItem onClick={addChapter}>
      <div className="menuItem">
        <img src={`/assets/icons/visualize/draft.svg`} />
        <div>From scratch</div>
      </div>
    </DropdownItem>
  );
}
