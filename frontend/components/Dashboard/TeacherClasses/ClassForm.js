"use client";

import { useRef } from "react";
import { StyledForm } from "../../styles/StyledForm";
import DisplayError from "../../ErrorMessage";
import useTranslation from "next-translate/useTranslation";
import TipTapEditor from "../../TipTap/Main";
import Button from "../../DesignSystem/Button";

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
  const titleRef = useRef(inputs?.title ?? "");
  const descriptionRef = useRef(inputs?.description ?? "");

  const handleTitleChange = (event) => {
    titleRef.current = event.target.value;
    handleChange(event);
  };

  const handleDescriptionChange = (content) => {
    descriptionRef.current = content;
  };

  const handleDescriptionBlur = () => {
    handleChange({
      target: {
        name: "description",
        value: descriptionRef.current,
      },
    });
  };

  const handleFormSubmit = (event) => {
    handleSubmit(event, {
      ...inputs,
      title: titleRef.current,
      description: descriptionRef.current,
    });
  };

  return (
    <div>
      <StyledForm method="POST" onSubmit={handleFormSubmit}>
        <DisplayError error={error} />

        <fieldset disabled={loading} aria-busy={loading}>
          <div className="infoPane">
            <div className="classFormField">
              <label htmlFor="class-title">
                {t("classForm.title", {}, { default: "Title" })}
              </label>
              <div className="classFormTitleEditor">
                <input
                  id="class-title"
                  type="text"
                  name="title"
                  value={inputs?.title ?? ""}
                  onChange={handleTitleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="classFormField">
              <div className="classFormFieldLabel">
                {t("classForm.description", {}, { default: "Description" })}
              </div>
              <div className="classFormDescriptionEditor">
                <TipTapEditor
                  content=""
                  onUpdate={handleDescriptionChange}
                  onBlur={handleDescriptionBlur}
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
            </div>

            <div className="submitButton">
              <Button type="submit">{submitBtnName}</Button>
            </div>
          </div>
        </fieldset>
      </StyledForm>
    </div>
  );
}
