import useTranslation from "next-translate/useTranslation";

import TipTapEditor from "../../../../TipTap/Main";
import { EditorFields, EditorField, EditorLabel, EditorHint } from "../ContentEditorLayout";

// Title / instructions / placeholder editors shared by the create, copy and
// edit assignment pages.
export default function AssignmentFields({ inputs, handleChange, mediaLibraryProps }) {
  const { t } = useTranslation("classes");
  const update = (name) => (value) => handleChange({ target: { name, value } });

  return (
    <EditorFields>
      <EditorField>
        <EditorLabel>{t("assignment.title")}</EditorLabel>
        <TipTapEditor
          content={inputs?.title || ""}
          onUpdate={update("title")}
          isEditable={true}
          toolbarVisible={false}
        />
      </EditorField>

      <EditorField>
        <EditorLabel>{t("assignment.instructions", {}, { default: "Instructions" })}</EditorLabel>
        <TipTapEditor
          content={inputs?.content || ""}
          onUpdate={update("content")}
          isEditable={true}
          toolbarVisible={true}
          {...mediaLibraryProps}
        />
      </EditorField>

      <EditorField>
        <EditorLabel>
          {t("assignment.placeholderDescription", {}, { default: "Placeholder presented to students" })}
        </EditorLabel>
        <EditorHint>
          {t("assignment.placeholderInstructions", {}, {
            default: "Template for your students to fill in (you can leave this blank):",
          })}
        </EditorHint>
        <TipTapEditor
          content={inputs?.placeholder || ""}
          onUpdate={update("placeholder")}
          isEditable={true}
          toolbarVisible={true}
          {...mediaLibraryProps}
        />
      </EditorField>
    </EditorFields>
  );
}
