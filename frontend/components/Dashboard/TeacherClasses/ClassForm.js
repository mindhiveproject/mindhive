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
                  style={{ width: "100%", maxWidth: "400px" }}
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
              <div style={{ width: "100%", maxWidth: "400px" }}>
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

            <div className="classFormField">
              <label htmlFor="class-doe">
                <div className="checkboxField">
                  <input
                    id="class-doe"
                    type="checkbox"
                    name="isDoe"
                    checked={!!inputs?.isDoe}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span>
                    {t("classForm.doe", {}, {
                      default:
                        "This class is in an NYC public school (NYC DOE)",
                    })}
                  </span>
                </div>
              </label>
            </div>

            {inputs?.isDoe && (
              <div className="classFormField">
                <label htmlFor="class-school">
                  {t("classForm.school", {}, {
                    default: "School code (DBN)",
                  })}
                </label>
                <input
                  id="class-school"
                  type="text"
                  name="school"
                  placeholder="02M475"
                  maxLength={6}
                  style={{ width: "100%", maxWidth: "400px" }}
                  value={inputs?.school ?? ""}
                  onChange={handleChange}
                  disabled={loading}
                />
                <p>
                  {t("classForm.schoolHint", {}, {
                    default:
                      "Your school's six-character DOE code, for example 02M475. MindHive uses it only to manage your school's data under its agreement with NYC DOE.",
                  })}
                </p>
              </div>
            )}

            <div className="submitButton">
              <Button type="submit">
                {submitBtnName}
              </Button>
            </div>
          </div>
        </fieldset>
      </StyledForm>
    </div>
  );
}
