import { DropdownItem } from "semantic-ui-react";

import { useMutation } from "@apollo/client";
import { DELETE_VIZSECTION } from "../../../../Mutations/VizSection";
import { DELETE_VIZCHAPTER } from "../../../../Mutations/VizChapter";

import { GET_VIZJOURNALS } from "../../../../Queries/VizJournal";

export default function DeleteChapter({
  projectId,
  studyId,
  part,
  chapter,
  selectChapter,
}) {
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
    // de-select the chapter
    await selectChapter({
      partId: part?.id,
      chapterId: undefined,
    });
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
