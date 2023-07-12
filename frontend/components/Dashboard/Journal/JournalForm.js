import { StyledForm } from "../../styles/StyledForm";
import DisplayError from "../../ErrorMessage";
import useTranslation from "next-translate/useTranslation";

export default function JournalForm({
  inputs,
  handleChange,
  handleSubmit,
  submitBtnName,
  loading,
  error,
}) {
  const { t } = useTranslation("classes");

  return (
    <div className="addJournal">
      <StyledForm method="POST" onSubmit={handleSubmit}>
        <DisplayError error={error} />
        <h1>Create a new journal</h1>
        <fieldset disabled={loading} aria-busy={loading}>
          <div className="infoPane">
            <label htmlFor="title">
              <p>Journal title</p>
              <input
                type="title"
                name="title"
                value={inputs?.title}
                onChange={handleChange}
                required
              />
            </label>

            <label htmlFor="description">
              <p>Description</p>
              <textarea
                id="description"
                rows="50"
                name="description"
                value={inputs?.description}
                onChange={handleChange}
              />
            </label>

            <div className="submitButton">
              <button type="submit">{submitBtnName}</button>
            </div>
          </div>
        </fieldset>
      </StyledForm>
    </div>
  );
}
