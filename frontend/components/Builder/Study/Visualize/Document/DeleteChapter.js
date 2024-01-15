import { DropdownItem } from "semantic-ui-react";

import { useMutation } from "@apollo/client";
import { DELETE_VIZSECTION } from "../../../../Mutations/VizSection";
import { DELETE_VIZCHAPTER } from "../../../../Mutations/VizChapter";

import { STUDY_VIZJOURNAL } from "../../../../Queries/VizJournal";

export default function DeleteChapter({ studyId, chapter }) {
  const [
    deleteSection,
    {
      data: deleteSectionData,
      loading: deleteSectionLoading,
      error: deleteSectionError,
    },
  ] = useMutation(DELETE_VIZSECTION, {
    variables: {},
  });

  const [deleteChapter, { data, loading, error }] = useMutation(
    DELETE_VIZCHAPTER,
    {
      variables: {},
      refetchQueries: [{ query: STUDY_VIZJOURNAL, variables: { id: studyId } }],
    }
  );

  const deleteChapterAndSections = async () => {
    // delete all sections in this chapter
    chapter?.vizSections.forEach(async (section) => {
      await deleteSection({
        variables: {
          id: section?.id,
        },
      });
    });
    // delete the chapter
    await deleteChapter({ variables: { id: chapter?.id } });
  };

  return (
    <DropdownItem onClick={deleteChapterAndSections}>
      <div className="menuItem">
        <img src={`/assets/icons/visualize/delete.svg`} />
        <div>Delete</div>
      </div>
    </DropdownItem>
  );
}
