import DisplayError from "../../../ErrorMessage";

import useTranslation from "next-translate/useTranslation";

export default function StudySpecificInfo({
  user,
  task,
  handleChange,
  handleMultipleUpdate,
  submitBtnName,
  loading,
  error,
}) {
  const { t } = useTranslation("classes");

  return (
    <>
      <DisplayError error={error} />

      <fieldset disabled={loading} aria-busy={loading}>

        <div className="block">
          <label htmlFor="subtitle">
            {t("studySpecific.subtitle", "Subtitle")}
            <input
              type="text"
              name="subtitle"
              value={task?.subtitle}
              onChange={handleChange}
            />
          </label>
        </div>
        
        <div>
          <label>{t("studySpecific.testId", "Test ID")}</label>
          <p>
            {task?.testId}
          </p>
        </div>
      
      </fieldset>
    </>
  );
}
