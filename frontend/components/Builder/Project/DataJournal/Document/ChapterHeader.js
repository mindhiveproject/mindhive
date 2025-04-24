import { useMutation } from "@apollo/client";
import useForm from "../../../../../lib/useForm";
import { UPDATE_VIZCHAPTER } from "../../../../Mutations/VizChapter";
import { GET_VIZJOURNALS } from "../../../../Queries/VizJournal";
import { StyledInput } from "../../../../styles/StyledForm";
import { Checkbox } from "semantic-ui-react";
import RestrictedAccess, {
  OnlyAdminAccess,
} from "../../../../Global/Restricted";

export default function ChapterHeader({
  user,
  projectId,
  studyId,
  part,
  chapter,
}) {
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
          isTemplate: inputs?.isTemplate,
        },
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
    <div id={chapter?.id}>
      <div className="originDataTitle">
        {part?.dataOrigin === "STUDY" && "Study data"}
        {part?.dataOrigin === "TEMPLATE" && "Template data"}
        {part?.dataOrigin === "SIMULATED" && "Simulated data"}
        {part?.dataOrigin === "UPLOADED" && "Uploaded data"}
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

          {/* <OnlyAdminAccess user={user}>
            <div>
              <Checkbox
                label="Make the chapter a template"
                onChange={(e, data) =>
                  handleChange({
                    target: { name: "isTemplate", value: data.checked },
                  })
                }
                checked={inputs?.isTemplate}
              />
            </div>
          </OnlyAdminAccess> */}

          {(inputs?.title !== chapter.title ||
            inputs?.description !== chapter.description ||
            inputs?.isTemplate !== chapter.isTemplate) && (
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
