import { StyledInput } from "../../styles/StyledForm";
import DisplayError from "../../ErrorMessage";
import useTranslation from "next-translate/useTranslation";
import ConsentContent from "./Content";
import Collaborators from "../../Global/Collaborators";

export default function ConsentForm({
  inputs,
  handleChange,
  handleSave,
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
      <div className="consentHeader">
        <h1>{headerName}</h1>
        <div className="submitButton">
          <button onClick={handleSave}>{submitBtnName}</button>
        </div>
      </div>
      <StyledInput>
        <DisplayError error={error} />

        <Collaborators
          collaborators={collaborators}
          handleChange={handleChange}
        />

        <fieldset disabled={loading} aria-busy={loading}>
          <div className="infoPane">
            <label htmlFor="title">
              Title
              <input
                type="title"
                name="title"
                value={inputs?.title}
                onChange={handleChange}
                required
              />
            </label>

            <label htmlFor="description">
              Description
              <textarea
                id="description"
                rows="5"
                name="description"
                value={inputs?.description}
                onChange={handleChange}
              />
            </label>
          </div>
        </fieldset>
      </StyledInput>
      <ConsentContent info={inputs?.info} handleChange={handleChange} />
    </div>
  );
}
