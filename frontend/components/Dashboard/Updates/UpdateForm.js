import FindMembersWhere from "../../Find/SearchMembers";
import JoditEditor from "../../Jodit/Editor";
import { StyledInput } from "../../styles/StyledForm";
import { Radio } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

export default function UpdateForm({
  inputs,
  handleChange,
  loading,
  creationMode,
}) {
  const { t } = useTranslation("common");
  const setContent = (content) =>
    handleChange({
      target: { name: "description", value: content },
    });

  return (
    <StyledInput>
      {/* <h1>{inputs?.title}</h1>
      <p>{inputs?.link}</p> */}

      {creationMode && (
        <FindMembersWhere
          members={inputs?.members}
          handleChange={handleChange}
        />
      )}

      <div>
        <label htmlFor="title">
          {t("update.title")}
          <input
            type="text"
            name="title"
            value={inputs?.title}
            onChange={handleChange}
            required
          />
        </label>
      </div>

      <div>
        <label htmlFor="link">
          {t("update.link")}
          <input
            type="text"
            name="link"
            value={inputs?.link}
            onChange={handleChange}
            required
          />
        </label>
      </div>

      <JoditEditor content={inputs.description} setContent={setContent} />

      <div className="iconTitle">
        <div>{t("update.sendEmail")}</div>
        <Radio
          toggle
          checked={inputs?.sendEmail}
          onChange={() => {
            handleChange({
              target: {
                name: "sendEmail",
                value: !inputs?.sendEmail,
              },
            });
          }}
        />
      </div>
    </StyledInput>
  );
}
