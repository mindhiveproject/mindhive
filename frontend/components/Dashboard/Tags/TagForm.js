import JoditEditor from "../../Jodit/Editor";
import { StyledInput } from "../../styles/StyledForm";
import LevelSelector from "./Level";
import TagSelector from "./Selector";
import useTranslation from "next-translate/useTranslation";

export default function TagForm({ inputs, handleChange, loading }) {
  const { t } = useTranslation("common");
  const setContent = (content) =>
    handleChange({
      target: { name: "description", value: content },
    });

  return (
    <StyledInput>
      <h1>{inputs.title}</h1>

      <div>
        <label htmlFor="title">
          {t("tag.title")}
          <input
            type="text"
            name="title"
            value={inputs?.title}
            onChange={handleChange}
            required
          />
        </label>
      </div>

      <JoditEditor content={inputs.description} setContent={setContent} />

      <LevelSelector handleChange={handleChange} level={inputs?.level} />

      <TagSelector handleChange={handleChange} parentTag={inputs?.parent} />
    </StyledInput>
  );
}
