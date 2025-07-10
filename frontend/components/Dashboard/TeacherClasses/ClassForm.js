import { StyledForm } from "../../styles/StyledForm";
import DisplayError from "../../ErrorMessage";
import useTranslation from "next-translate/useTranslation";

export default function ClassForm({
  inputs,
  handleChange,
  handleSubmit,
  submitBtnName,
  loading,
  error,
}) {
  const { t } = useTranslation("classes");

  return (
    <div>
      <StyledForm method="POST" onSubmit={handleSubmit}>
        <DisplayError error={error} />

        <fieldset disabled={loading} aria-busy={loading}>
          <div className="infoPane">
            <label htmlFor="title">
              {t("classForm.title")}
              <input
                type="title"
                name="title"
                value={inputs?.title}
                onChange={handleChange}
                required
              />
            </label>

            <label htmlFor="description">
              {t("classForm.description")}
              <textarea
                id="description"
                rows="10"
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
