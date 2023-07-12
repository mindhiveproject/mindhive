import { StyledForm } from "../../styles/StyledForm";
import DisplayError from "../../ErrorMessage";
import useTranslation from "next-translate/useTranslation";
import ConsentContent from "./Content";
import Collaborators from "../../Global/Collaborators";

export default function ConsentForm({
  inputs,
  handleChange,
  handleSubmit,
  headerName,
  submitBtnName,
  loading,
  error,
}) {
  const { t } = useTranslation("classes");
  const collaborators =
    (inputs && inputs?.collaborators?.map((c) => c?.id)) || [];

  return (
    <div>
      <h1>{headerName}</h1>
      <StyledForm method="POST" onSubmit={handleSubmit}>
        <DisplayError error={error} />

        <Collaborators
          collaborators={collaborators}
          handleChange={handleChange}
        />

        <fieldset disabled={loading} aria-busy={loading}>
          <div className="infoPane">
            <label htmlFor="title">
              {t("common.title")}
              <input
                type="title"
                name="title"
                value={inputs?.title}
                onChange={handleChange}
                required
              />
            </label>

            <label htmlFor="description">
              {t("common.description")}
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
      <ConsentContent info={inputs?.info} handleChange={handleChange} />
    </div>
  );
}
