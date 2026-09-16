import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import TipTapEditor from "../../TipTap/Main";
import ToggleSwitch from "../../DesignSystem/ToggleSwitch";

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 900px;
  min-width: 0;

  .resource-form-editor {
    width: 100%;
    min-width: 0;
  }

  .resource-form-editor > * {
    width: 100%;
    box-sizing: border-box;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
`;

const Label = styled.div`
  color: var(--MH-Theme-Neutrals-Black, #171717);
  font: var(--MH-Type-Label-Large);
  letter-spacing: 0;
`;

const VisibilityRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 40px;
`;

export default function ResourceForm({ user, inputs, handleChange, isAdmin }) {
  const { t } = useTranslation("classes");
  const canManageVisibility =
    isAdmin ??
    user?.permissions?.some((permission) => permission?.name === "ADMIN");
  const content =
    inputs?.content && typeof inputs.content === "object" ? inputs.content : {};

  return (
    <Form>
      {canManageVisibility && (
        <VisibilityRow>
          <Label>
            {t("boardManagement.makePublic", {}, { default: "Make public" })}
          </Label>
          <ToggleSwitch
            checked={Boolean(inputs?.isPublic)}
            aria-label={t(
              "boardManagement.makePublic",
              {},
              { default: "Make public" }
            )}
            onChange={(checked) => {
              handleChange({
                target: {
                  name: "isPublic",
                  value: checked,
                },
              });
            }}
          />
        </VisibilityRow>
      )}

      <Field>
        <Label>
          {t("boardManagement.titleText", {}, { default: "Title" })}
        </Label>
        <div className="resource-form-editor">
          <TipTapEditor
            content={inputs?.title || ""}
            toolbarVisible={false}
            onUpdate={(newTitle) =>
              handleChange({
                target: {
                  name: "title",
                  value: newTitle,
                },
              })
            }
          />
        </div>
      </Field>

      <Field>
        <Label>
          {t("boardManagement.content", {}, { default: "Content" })}
        </Label>
        <div className="resource-form-editor">
          <TipTapEditor
            content={content.main || ""}
            mediaLibraryId={user?.id ?? null}
            mediaLibrarySource={
              user?.id
                ? {
                    sourceType: "profile",
                    sourceId: user.id,
                    createdWith: "upload",
                  }
                : null
            }
            onUpdate={(newContent) =>
              handleChange({
                target: {
                  name: "content",
                  value: { ...content, main: newContent },
                },
              })
            }
          />
        </div>
      </Field>
    </Form>
  );
}
