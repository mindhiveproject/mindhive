"use client";

import { StyledForm } from "../../styles/StyledForm";
import DisplayError from "../../ErrorMessage";
import useTranslation from "next-translate/useTranslation";
import TipTapEditor from "../../TipTap/Main";
import Button from "../../DesignSystem/Button";
import { descriptionValueForState } from "../../Proposal/Card/Forms/utils";

export default function ClassForm({
  user,
  inputs,
  handleChange,
  handleSubmit,
  submitBtnName,
  loading,
  error,
}) {
  const { t } = useTranslation("classes");

// Strip HTML tags from text
  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  };

  const handleTitleChange = (content) => {
    handleChange({ target: { name: "title", value: stripHtml(content) } });
  };

  const handleDescriptionChange = (content) => {
    handleChange({
      target: {
        name: "description",
        value: content,
      },
    });
  };

  return (
    <div>
      <StyledForm method="POST" onSubmit={handleSubmit}>
        <DisplayError error={error} />

        <fieldset disabled={loading} aria-busy={loading}>
          <div className="infoPane">
            <label>
              {t("classForm.title", "Title")}
              <div className="classFormTitleEditor">
                <TipTapEditor
                  content={inputs?.title ?? ""}
                  onUpdate={handleTitleChange}
                  isEditable={!loading}
                  toolbarVisible={false}
                />
              </div>
            </label>

            <label>
              {t("classForm.description", "Description")}
              <div className="classFormDescriptionEditor">
                <TipTapEditor
                  content={inputs?.description ?? ""}
                  onUpdate={handleDescriptionChange}
                  isEditable={!loading}
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
                />
              </div>
            </label>

            <div className="submitButton">
              <Button type="submit">{submitBtnName}</Button>
            </div>
          </div>
        </fieldset>
      </StyledForm>
    </div>
  );
}
