import { Icon, Accordion } from "semantic-ui-react";
import ReactHtmlParser from "react-html-parser";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";

export default function Viewer({ task, close, openEditor, openPreview }) {
  const { t } = useTranslation("builder");
  const [active, setActive] = useState(false);
  const router = useRouter();
  const { locale } = router;
  const taskType = task?.taskType?.toLowerCase();
  const settings = task?.i18nContent?.[locale]?.settings || task?.settings;
  const resources =
    (settings?.resources && JSON.parse(settings?.resources)) || [];
  const aggregateVariables =
    (settings?.aggregateVariables &&
      JSON.parse(settings?.aggregateVariables)) ||
    [];  

  // parameters not from the survey builder
  const parameters =
    task?.parameters?.filter((p) => p?.type !== "survey") || [];

  // parameters from the survey builder
  const surveyItems =
    task?.parameters
      ?.filter((param) => param?.type === "survey")
      .map((param) => JSON.parse(param?.value))
      .flat()
      .map((page) => page?.page)
      .flat() || [];

  return (
    <>
      <div className="taskViewerHeader">
        <div>
          <h1>{task?.i18nContent?.[locale]?.title || task?.title}</h1>
          <p>{task?.i18nContent?.[locale]?.description || task?.description}</p>
        </div>
        <div className="rightPanel">
          <div className="taskViewerButtons">
            <div className="closeBtn" onClick={() => close()}>
              &times;
            </div>
            <div>
              <button
                className="previewBtn"
                onClick={() => {
                  openEditor();
                }}
              >
                {t("viewer.customize", "Customize")}
              </button>
            </div>
            <div>
              <button
                className="previewBtn"
                onClick={() => {
                  openPreview();
                }}
              >
                {t("viewer.preview", { taskType }, "Preview {{taskType}}")}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="taskViewerContent">
        <div className="leftPanel">
          {task?.image && (
            <div className="contentBlock">
              <h2>{t("viewer.screenshot", "Screenshot")}</h2>
              <img src={task?.image} />
            </div>
          )}

          {settings?.background && (
            <div className="contentBlock">
              <h2>{t("viewer.background", "Background")}</h2>
              <div>
                {settings?.background && (
                  <p>{ReactHtmlParser(settings?.background)}</p>
                )}
              </div>
            </div>
          )}

          {parameters.length > 0 && (
            <div>
              <h2>{t("viewer.parameters", "Parameters")}</h2>
              <p>{t("viewer.tweakableFeatures", { taskType }, "The following features of this {{taskType}} can be tweaked:")}</p>
              <p style={{ fontSize: "14px" }}>
                * {t("viewer.defaultValues", { taskType }, "Default values are shown (can clone {{taskType}} and modify these)")}
              </p>
              <div className="symbolBlock">
                {parameters.map((parameter, num) => (
                  <div style={{ padding: "5px" }} key={num}>
                    <p>
                      <Icon
                        name={parameter?.icon || "clipboard outline"}
                        style={{ color: "#556AEB" }}
                      />
                      <span style={{ fontWeight: "600" }}>
                        {parameter.help}
                      </span>
                    </p>
                    <p style={{ fontWeight: "lighter" }}>
                      {ReactHtmlParser(parameter.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {surveyItems.length > 0 && (
            <div>
              <h2>{t("viewer.surveyParameters", "Survey parameters")}</h2>
              <p>{t("viewer.tweakableFeatures", { taskType }, "The following features of this {{taskType}} can be tweaked:")}</p>
              <p style={{ fontSize: "14px" }}>
                * {t("viewer.defaultValues", { taskType }, "Default values are shown (can clone {{taskType}} and modify these)")}
              </p>
              <div className="symbolBlock">
                {surveyItems.map((item, num) => (
                  <div style={{ padding: "5px" }} key={num}>
                    <p>
                      <Icon
                        name={item?.icon || "clipboard outline"}
                        style={{ color: "#556AEB" }}
                      />
                      <span style={{ fontWeight: "600" }}>
                        {item?.type === "text" && t("viewer.text", "Text")}
                        {item?.type === "vas" && t("viewer.visualAnalogueScale", "Visual analogue scale")}
                        {item?.type === "likert" && t("viewer.likertScale", "Likert scale")}
                        {item?.type === "freeinput" && t("viewer.freeTextInput", "Free text input")}
                        {item?.type === "select" && t("viewer.selectOne", "Select one")}
                        {item?.type === "checkbox" && t("viewer.selectMany", "Select many")}
                      </span>
                    </p>
                    <p style={{ fontWeight: "lighter" }}>
                      {ReactHtmlParser(item?.header)}
                    </p>
                    <p style={{ fontWeight: "lighter" }}>
                      {ReactHtmlParser(item?.text)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {settings?.descriptionBefore && (
            <div>
              <h2>
                <span dangerouslySetInnerHTML={{ __html: t("viewer.beforeParticipation", { taskType }, "What participants see <u>before</u> taking the {{taskType}}") }} />
              </h2>
              <p className="symbolBlock">{settings?.descriptionBefore}</p>
            </div>
          )}

          {settings?.descriptionAfter && (
            <div>
              <h2>
                <span dangerouslySetInnerHTML={{ __html: t("viewer.afterParticipation", { taskType }, "What participants see <u>after</u> taking the {{taskType}}") }} />
              </h2>
              <p className="symbolBlock">{settings?.descriptionAfter}</p>
            </div>
          )}
        </div>

        <div className="rightPanel">
          {task?.settings?.mobileCompatible && (
            <div>
              <Icon
                id="favoriteButton"
                name="mobile alternate"
                color="teal"
                size="large"
              />
              <span>{t("viewer.mobileCompatible", "Mobile compatible")}</span>
            </div>
          )}
          {aggregateVariables.length > 0 && (
            <div className="contentBlock">
              <h2>{t("viewer.aggregateVariables", "Aggregate Variables")}</h2>
              <p>
                {t("viewer.aggregateVariablesDesc", { taskType }, "These data are automatically written to a csv file upon completion of the {{taskType}}")}
              </p>
              {settings?.addInfo && (
                <Accordion>
                  <Accordion.Title
                    active={active}
                    onClick={() => setActive(!active)}
                  >
                    <Icon name="dropdown" />
                    {t("viewer.moreInfo", "more info")}
                  </Accordion.Title>
                  <Accordion.Content active={active}>
                    <p>{ReactHtmlParser(settings?.addInfo)}</p>
                  </Accordion.Content>
                </Accordion>
              )}
              <ul>
                {aggregateVariables.map((variable, num) => (
                  <li key={typeof variable === 'object' && variable.name ? variable.name : num}>
                    {ReactHtmlParser(typeof variable === 'string' ? variable : variable.name)}
                    {typeof variable === 'object' && variable.description && (
                      <>
                        <br />
                        <span className="bodySmall">{ReactHtmlParser(variable.description)}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {settings?.scoring && (
            <div className="contentBlock">
              <h2>{t("viewer.scoring", "Scoring")}</h2>
              <p>{ReactHtmlParser(settings?.scoring)}</p>
            </div>
          )}

          {settings?.format && (
            <div className="contentBlock">
              <h2>{t("viewer.format", "Format")}</h2>
              <p>{ReactHtmlParser(settings?.format)}</p>
            </div>
          )}

          {settings?.duration && (
            <div className="contentBlock">
              <h2>{t("viewer.duration", "Duration")}</h2>
              <p>{settings?.duration}</p>
            </div>
          )}

          {resources.length > 0 && (
            <div className="contentBlock">
              <h2>{t("viewer.resources", "Resources")}</h2>
              <ul>
                {resources.map((resource, num) => (
                  <li key={num}>{ReactHtmlParser(resource)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
