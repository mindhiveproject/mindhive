import DisplayError from "../../../ErrorMessage";
import useTranslation from "next-translate/useTranslation";
import SettingBlock from "./SettingBlock";
import I18nContentEditor from "./I18nContentEditor";
import { useRouter } from "next/router";

export default function Basic({
  user,
  task,
  handleChange,
  handleMultipleUpdate,
  submitBtnName,
  loading,
  error,
  isInStudyBuilder,
}) {
  const { t } = useTranslation("builder");
  const router = useRouter();   
  const { locale } = router;

  // initialize task settings if there are no
  if (!task?.settings) {
    task.settings = {
      mobileCompatible: false,
      descriptionBefore: "",
      descriptionAfter: "",
      background: "",
      duration: "",
      scoring: "",
      format: "",
      resources: "[]",
      aggregateVariables: "[]",
      addInfo: "",
    };
  }

  // in the study builder only display specific parameters
  const displayedParameterKeys = isInStudyBuilder
    ? []
    : Object.keys(task?.settings);
  // const displayedParameterKeys = isInStudyBuilder
  //   ? ["descriptionBefore", "descriptionAfter"]
  //   : Object.keys(task?.settings);

  return (
    <>
      <DisplayError error={error} />

      <fieldset disabled={loading} aria-busy={loading}>
        
        {!isInStudyBuilder && (
          <I18nContentEditor 
            task={task} 
            handleChange={handleChange}
          />
        )}

        <div className="block">
          <label htmlFor="title">
            {t("titleText")}
            <input
              type="text"
              name="title"
              value={task?.title}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        {!isInStudyBuilder && (
          <>
            <div className="block">
              <label htmlFor="description">
                {t("descriptionDevelop")}
                <textarea
                  id="description"
                  name="description"
                  value={task?.description}
                  onChange={handleChange}
                />
              </label>
              <span>
                {t("descriptionDevelopHelp")}
              </span>
            </div>

            <div className="block">
              <label htmlFor="descriptionForParticipants">
                {t("descriptionDiscover")}
                <textarea
                  id="descriptionForParticipants"
                  name="descriptionForParticipants"
                  value={task?.descriptionForParticipants}
                  onChange={handleChange}
                />
              </label>
              <span>
                {t("descriptionDiscoverHelp")}
              </span>
            </div>
          </>
        )}

        {task?.isExternal && (
          <div className="block">
            <label htmlFor="link">
              {t("link")}
              <input
                type="text"
                id="link"
                name="link"
                value={task.link || ""}
                onChange={handleChange}
              />
            </label>
            <span>{t("externalDataWarning")}</span>
          </div>
        )}

        {task?.settings && Object.keys(task?.settings).length && (
          <>
            {Object.keys(task?.settings)
              .filter((parameter) => displayedParameterKeys.includes(parameter))
              .map((name, i) => (
                <SettingBlock
                  key={i}
                  name={name}
                  value={task?.settings[name]}
                  handleChange={handleChange}
                  task={task}
                  isInStudyBuilder={isInStudyBuilder}
                />
              ))}
          </>
        )}
      </fieldset>
    </>
  );
}
