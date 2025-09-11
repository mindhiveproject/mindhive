import Head from "next/head";
import ReactHtmlParser from "react-html-parser";
import { Icon, Accordion } from "semantic-ui-react";
import { useRouter } from "next/router";
import { StyledContent } from "../../styles/StyledTaskPage";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

export default function TaskPage({ user, task }) {
  const [active, setActive] = useState(false);
  const { t } = useTranslation("builder");

  const taskType = task?.taskType?.toLowerCase();
  const router = useRouter();
  const { locale } = router;  
  
  const settings = task?.i18nContent?.[locale]?.settings ?? task?.settings ?? {};
  console.log(settings);
  const resources =
    (settings?.resources && JSON.parse(settings?.resources)) || [];
  const aggregateVariables =
    (settings?.aggregateVariables &&
      JSON.parse(settings?.aggregateVariables)) ||
    [];

  // parameters not from the survey builder
    // Prefer localized parameters if available, else fallback
    const parameters =
    task?.i18nContent?.[locale]?.parameters?.filter((p) => p?.type !== "survey") ??
    task?.parameters?.filter((p) => p?.type !== "survey") ??
    [];

    // Parameters coming from the survey builder
    const surveyItems =
    (
      task?.i18nContent?.[locale]?.parameters ??
      task?.parameters ??
      []
    )
      .filter((param) => param?.type === "survey")
      .map((param) => {
        try {
          return JSON.parse(param?.value);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .flat()
      .map((page) => page?.page)
     .flat() ?? [];

  return (
    <StyledContent>
      <Head>
        <title>MindHive | {task?.i18nContent?.[locale]?.title || task?.title}</title>
      </Head>

      <div className="leftPanel">
        {task?.image && (
          <div className="contentBlock">
            <h2>{t("taskPage.screenshot")}</h2>
            <img src={task?.image} />
          </div>
        )}

        {settings?.background && (
          <div className="contentBlock">
            <h2>{t("taskPage.background")}</h2>
            <div>
              {settings?.background && (
                <p>{ReactHtmlParser(settings?.background)}</p>
              )}
            </div>
          </div>
        )}

        {parameters.length > 0 && (
          <div>
            <h2>{t("taskPage.parameters")}</h2>
            <p>{t("taskPage.parametersDescription", { taskType })}</p>
            <p style={{ fontSize: "14px" }}>
              {t("taskPage.parametersNote", { taskType })}
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
                      {parameter?.help || parameter?.name}
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
            <h2>{t("taskPage.surveyParameters")}</h2>
            <p>{t("taskPage.parametersDescription", { taskType })}</p>
            <p style={{ fontSize: "14px" }}>
              {t("taskPage.parametersNote", { taskType })}
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
                      {item?.type === "text" && t("taskPage.text")}
                      {item?.type === "vas" && t("taskPage.vas")}
                      {item?.type === "likert" && t("taskPage.likert")}
                      {item?.type === "freeinput" && t("taskPage.freeinput")}
                      {item?.type === "select" && t("taskPage.select")}
                      {item?.type === "checkbox" && t("taskPage.checkbox")}
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
              {t("taskPage.before", { taskType })}
            </h2>
            <p className="symbolBlock">{settings?.descriptionBefore}</p>
          </div>
        )}

        {settings?.descriptionAfter && (
          <div>
            <h2>
              {t("taskPage.after", { taskType })}
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
            <span>{t("taskPage.mobileCompatible")}</span>
          </div>
        )}

        {aggregateVariables.length > 0 && (
          <div className="contentBlock">
            <h2>{t("taskPage.aggregateVariables")}</h2>
            <p>
              {t("taskPage.aggregateVariablesDescription", { taskType })}
            </p>
            {settings?.addInfo && (
              <Accordion>
                <Accordion.Title
                  active={active}
                  onClick={() => setActive(!active)}
                >
                  <Icon name="dropdown" />
                  {t("taskPage.moreInfo")}
                </Accordion.Title>
                <Accordion.Content active={active}>
                  <p>{ReactHtmlParser(settings?.addInfo)}</p>
                </Accordion.Content>
              </Accordion>
            )}
            <ul>
              {aggregateVariables.map((variable, num) => (
                <li key={num}>{ReactHtmlParser(variable)}</li>
              ))}
            </ul>
          </div>
        )}

        {settings?.scoring && (
          <div className="contentBlock">
            <h2>{t("taskPage.scoring")}</h2>
            <p>{ReactHtmlParser(settings?.scoring)}</p>
          </div>
        )}

        {settings?.format && (
          <div className="contentBlock">
            <h2>{t("taskPage.format")}</h2>
            <p>{ReactHtmlParser(settings?.format)}</p>
          </div>
        )}

        {settings?.duration && (
          <div className="contentBlock">
            <h2>{t("taskPage.duration")}</h2>
            <p>{settings?.duration}</p>
          </div>
        )}

        {resources.length > 0 && (
          <div className="contentBlock">
            <h2>{t("taskPage.resources")}</h2>
            <ul>
              {resources.map((resource, num) => (
                <li key={num}>{ReactHtmlParser(resource)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </StyledContent>
  );
}
