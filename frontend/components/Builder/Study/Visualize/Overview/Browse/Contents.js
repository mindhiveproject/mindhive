import { useMutation } from "@apollo/client";
import { ADD_VIZCHAPTER } from "../../../../../Mutations/VizChapter";
import { STUDY_VIZJOURNAL } from "../../../../../Queries/VizJournal";

export default function Contents({
  studyId,
  journal,
  chapterId,
  selectChapter,
}) {
  const [addChapter, { data, loading, error }] = useMutation(ADD_VIZCHAPTER, {
    variables: {
      input: {
        title: "Test viz chapter 2",
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
    <div className="contents">
      {journal?.vizParts.map((part) => (
        <div className="part">
          <div>{part?.dataOrigin}</div>
          <div>
            {part?.vizChapters.map((chapter) => (
              <div className="chapter">
                <div
                  className="title"
                  onClick={() => selectChapter({ chapterId: chapter?.id })}
                >
                  {chapter?.title}
                  {chapter?.id === chapterId && "Selected"}
                </div>
                <div>
                  {chapter?.vizSections.map((section) => (
                    <div className="section">{section?.title}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div>
        <button onClick={addChapter}>New chapter</button>
      </div>
    </div>
  );
}
