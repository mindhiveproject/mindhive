import JoditEditorPro from "../../../Jodit/EditorPro";
import StyledNote from "../../../styles/StyledNote";
import useTranslation from "next-translate/useTranslation";

export default function CreatePost({
  journal,
  user,
  content,
  setContent,
  title,
  setTitle,
  handleSave,
  headerTitle,
}) {
  const { t } = useTranslation("common");
  return (
    <StyledNote>
      <h1>{headerTitle}</h1>
      <label htmlFor="title">
        <p>{t("journal.title")}</p>
        <input
          type="text"
          id="title"
          name="title"
          value={title}
          onChange={({ target }) => setTitle(target?.value)}
          required
        />
      </label>
      <JoditEditorPro content={content} setContent={setContent} />
      <button onClick={handleSave}>{t("save")}</button>
    </StyledNote>
  );
}
