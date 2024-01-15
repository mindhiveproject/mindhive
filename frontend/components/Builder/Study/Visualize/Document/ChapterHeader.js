import { useMutation } from "@apollo/client";
import useForm from "../../../../../lib/useForm";
import { UPDATE_VIZCHAPTER } from "../../../../Mutations/VizChapter";
import { STUDY_VIZJOURNAL } from "../../../../Queries/VizJournal";
import { StyledInput } from "../../../../styles/StyledForm";

export default function ChapterHeader({ studyId, part, chapter }) {
  const { inputs, handleChange } = useForm({
    ...chapter,
  });

  const [updateChapter, { data, loading, error }] = useMutation(
    UPDATE_VIZCHAPTER,
    {
      variables: {
        id: chapter?.id,
        input: {
          title: inputs?.title,
          description: inputs?.description,
        },
      },
      refetchQueries: [{ query: STUDY_VIZJOURNAL, variables: { id: studyId } }],
    }
  );

  return (
    <div>
      <div className="originDataTitle">
        {part?.dataOrigin === "STUDY" ? "Study data" : "Simulated data"}
      </div>

      <StyledInput>
        <fieldset disabled={loading} aria-busy={loading}>
          <label htmlFor="title">
            <input
              className="title"
              type="title"
              name="title"
              value={inputs?.title}
              onChange={handleChange}
              required
            />
          </label>

          <label htmlFor="description">
            <textarea
              className="description"
              id="description"
              name="description"
              value={inputs?.description}
              onChange={handleChange}
              rows={3}
            />
          </label>

          {(inputs?.title !== chapter.title ||
            inputs?.description !== chapter.description) && (
            <div className="submitButton">
              <button onClick={() => updateChapter()} type="submit">
                Save
              </button>
            </div>
          )}
        </fieldset>
      </StyledInput>
    </div>
  );
}
