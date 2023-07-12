import { StyledForm } from "../../styles/StyledForm";
import DisplayError from "../../ErrorMessage";
import useTranslation from "next-translate/useTranslation";

import FindMembers from "../../Find/Members";
import FindStudies from "../../Find/MyStudies";
import FindClasses from "../../Find/MyClasses";

export default function ChatForm({
  user,
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
        <h1>Create a new group chat</h1>
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

            <div className="membersBlock">
              <p>Add by study</p>
              <FindStudies
                user={user}
                studies={inputs?.studies}
                handleChange={handleChange}
              />
            </div>

            <div className="membersBlock">
              <p>Add by class</p>
              <FindClasses
                user={user}
                classes={inputs?.classes}
                handleChange={handleChange}
              />
            </div>

            <div className="membersBlock">
              <p>Add by members</p>
              <FindMembers
                members={inputs?.members}
                handleChange={handleChange}
              />
            </div>

            <div className="submitButton">
              <button type="submit">{submitBtnName}</button>
            </div>
          </div>
        </fieldset>
      </StyledForm>
    </div>
  );
}
