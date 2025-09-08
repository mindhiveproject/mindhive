import JoditEditor from "../../Jodit/Editor";
import { StyledInput } from "../../styles/StyledForm";
import { Radio } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

export default function ResourceForm({ user, inputs, handleChange, loading }) {
  const { t } = useTranslation("classes");
  const setContent = (content) =>
    handleChange({
      target: { name: "content", value: { main: content } },
    });

  return (
    <div>
      <StyledInput>
        <h1>{inputs.title}</h1>
        {user?.permissions.map((p) => p.name).includes("ADMIN") && (
          <div className="iconTitle">
            <div>{t("boardManagement.makePublic")}</div>
            <Radio
              toggle
              checked={inputs?.isPublic}
              onChange={() => {
                handleChange({
                  target: {
                    name: "isPublic",
                    value: !inputs?.isPublic,
                  },
                });
              }}
            />
          </div>
        )}

        <div>
          <label htmlFor="title">
            {t("boardManagement.titleText")}
            <input
              type="title"
              name="title"
              value={inputs?.title}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div>
          <label htmlFor="description">
            {t("boardManagement.description")}
            <textarea
              id="description"
              rows="5"
              name="description"
              value={inputs?.description}
              onChange={handleChange}
            />
          </label>
        </div>
      </StyledInput>

      <JoditEditor content={inputs.content?.main} setContent={setContent} />
    </div>
  );
}
