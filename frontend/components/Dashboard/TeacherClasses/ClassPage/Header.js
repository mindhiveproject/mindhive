import { useMutation } from "@apollo/client";
import { StyledForm } from "../../../styles/StyledForm";
import DisplayError from "../../../ErrorMessage";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../../lib/useForm";

import { EDIT_CLASS } from "../../../Mutations/Classes";
// import { GET_TEACHER_CLASSES } from "../../../Queries/Classes";

export default function Header({ user, myclass }) {
  const { t } = useTranslation("classes");

  const { inputs, handleChange, clearForm } = useForm({
    ...myclass,
  });

  const [updateClass, { data, loading, error }] = useMutation(EDIT_CLASS, {
    variables: inputs,
    refetchQueries: [
      // { query: GET_TEACHER_CLASSES, variables: { id: user?.id } },
    ],
  });

  return (
    <StyledForm>
      <div className="editableClassHeader">
        <DisplayError error={error} />
        <fieldset disabled={loading} aria-busy={loading}>
          <div className="infoPane">
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
              />
            </label>

            {(inputs?.title !== myclass.title ||
              inputs?.description !== myclass.description) && (
              <div className="submitButton">
                <button onClick={() => updateClass()} type="submit">
                  Save
                </button>
              </div>
            )}
          </div>
        </fieldset>
        <div className="teacher">Teacher {myclass?.creator?.username}</div>
      </div>
    </StyledForm>
  );
}
