import { StyledInput } from "../../styles/StyledForm";
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
  const { t } = useTranslation("common");
  return (
    <div className="addJournal">
      <StyledInput>
        <h1>{t("journal.createNewJournal")}</h1>
        <DisplayError error={error} />
        <div>
          <fieldset disabled={loading} aria-busy={loading}>
            <label htmlFor="title">
              <p>{t("journal.journalTitle")}</p>
              <input
                type="title"
                name="title"
                value={inputs?.title}
                onChange={handleChange}
                required
              />
            </label>
            <label htmlFor="description">
              <p>{t("journal.description")}</p>
              <textarea
                id="description"
                name="description"
                value={inputs?.description}
                onChange={handleChange}
              />
            </label>
            <div className="submitButton">
              <button onClick={handleSubmit}>{submitBtnName}</button>
            </div>
          </fieldset>
        </div>
      </StyledInput>
    </div>
  );
}
