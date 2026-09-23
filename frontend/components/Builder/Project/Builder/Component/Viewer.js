import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import IconButton from "../../../../DesignSystem/IconButton";
import ReactHtmlParser from "react-html-parser";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";
import { getTaskTypeLabelColors } from "../../../../../lib/taskTypeColors";

function plainText(value) {
  if (value == null) return "";
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function Viewer({ task, close, openEditor, openPreview }) {
  const { t } = useTranslation("builder");
  const router = useRouter();
  const { locale } = router;
  const taskType = task?.taskType?.toLowerCase();
  const settings = task?.i18nContent?.[locale]?.settings || task?.settings;
  const resources =
    (settings?.resources && JSON.parse(settings?.resources)) || [];
  const title = task?.i18nContent?.[locale]?.title || task?.title;
  const description =
    task?.i18nContent?.[locale]?.description || task?.description;
  const backgroundHtml = settings?.background;
  const backgroundText = plainText(backgroundHtml) || description;

  const parameters =
    task?.parameters?.filter((p) => p?.type !== "survey") ||
    task?.template?.parameters ||
    [];

  const surveyItems =
    task?.parameters
      ?.filter((param) => param?.type === "survey")
      .map((param) => JSON.parse(param?.value))
      .flat()
      .map((page) => page?.page)
      .flat() || [];

  const surveyItemLabel = (item) => {
    if (item?.type === "text") return t("viewer.text", {}, { default: "Text" });
    if (item?.type === "vas")
      return t("viewer.visualAnalogueScale", {}, {
        default: "Visual analogue scale",
      });
    if (item?.type === "likert")
      return t("viewer.likertScale", {}, { default: "Likert scale" });
    if (item?.type === "freeinput")
      return t("viewer.freeTextInput", {}, { default: "Free text input" });
    if (item?.type === "select")
      return t("viewer.selectOne", {}, { default: "Select one" });
    if (item?.type === "checkbox")
      return t("viewer.selectMany", {}, { default: "Select many" });
    return "";
  };

  let aggregateVariables = [];
  try {
    aggregateVariables = settings?.aggregateVariables
      ? JSON.parse(settings.aggregateVariables)
      : [];
  } catch (e) {
    console.warn("Invalid aggregateVariables JSON", e);
  }

  const durationLabel = plainText(settings?.duration);
  const formatLabel = plainText(settings?.format);
  const rawTaskType = task?.taskType;
  const typeLabelColors = getTaskTypeLabelColors(rawTaskType);
  const typeLabel = (() => {
    const type = String(rawTaskType || "").toUpperCase();
    if (type === "SURVEY")
      return t("viewer.typeSurvey", {}, { default: "Survey" });
    if (type === "TASK")
      return t("viewer.typeTask", {}, { default: "Task" });
    if (type === "BLOCK")
      return t("viewer.typeBlock", {}, { default: "Block" });
    if (type === "DESIGN")
      return t("viewer.typeDesign", {}, { default: "Design" });
    return rawTaskType
      ? String(rawTaskType).charAt(0) +
          String(rawTaskType).slice(1).toLowerCase()
      : "";
  })();

  return (
    <div className="blockPanel">
      <div className="blockPanelHeader">
        <div className="blockPanelTitle">
          <h1>{title}</h1>
        </div>
        <div className="blockPanelHeaderMain">
          <div className="blockPanelActions">
            <Button variant="filled" type="button" onClick={() => openEditor()}>
              {t("viewer.customize", {}, { default: "Customize" })}
            </Button>
            <Button variant="tonal" type="button" onClick={() => openPreview()}>
              {t("viewer.preview", { taskType }, { default: "Preview {{taskType}}" })}
            </Button>
          </div>
          <IconButton
            variant="subtle"
            elevated={false}
            ariaLabel={t("blockPanel.close", {}, { default: "Close" })}
            title={t("blockPanel.close", {}, { default: "Close" })}
            onClick={() => close()}
            icon={<span aria-hidden>&times;</span>}
          />
        </div>
      </div>
      <div className="blockPanelBody">
        {backgroundText && (
          <section className="blockPanelSection">
            <h2>{t("viewer.background", {}, { default: "Background" })}</h2>
            <div className="blockPanelMuted">
              {backgroundHtml
                ? ReactHtmlParser(backgroundHtml)
                : backgroundText}
            </div>
          </section>
        )}

        {(durationLabel || formatLabel || task?.settings?.mobileCompatible) && (
          <div className="blockPanelMetaRow">
            {durationLabel && (
              <div className="blockPanelDuration">
                <p className="blockPanelDurationLabel">
                  {t("viewer.duration", {}, { default: "Duration" })}
                </p>
                <p className="blockPanelDurationValue">{durationLabel}</p>
              </div>
            )}
            {formatLabel && (
              <div className="blockPanelDuration">
                <p className="blockPanelDurationLabel">
                  {t("viewer.format", {}, { default: "Format" })}
                </p>
                <p className="blockPanelDurationValue">{formatLabel}</p>
              </div>
            )}
            {task?.settings?.mobileCompatible && (
              <div className="blockPanelDuration">
                <p className="blockPanelDurationValue">
                  {t("viewer.mobileCompatible", {}, {
                    default: "Mobile compatible",
                  })}
                </p>
              </div>
            )}
            {typeLabel ? (
              <div className="blockPanelType">
                <p className="blockPanelDurationLabel">
                  {t("viewer.type", {}, { default: "Type" })}
                </p>
                <Chip
                  variant="static"
                  label={typeLabel}
                  style={{
                    alignSelf: "flex-start",
                    background: typeLabelColors.bg,
                    backgroundColor: typeLabelColors.bg,
                    color: typeLabelColors.fg,
                  }}
                />
              </div>
            ) : null}
          </div>
        )}

        {aggregateVariables.length > 0 && (
          <section className="blockPanelSection">
            <h2>
              {t("viewer.keyVariables", {}, { default: "Key Variables" })}
            </h2>
            <ul className="blockPanelVarList">
              {aggregateVariables.map((variable, idx) => (
                <li key={variable.varName || idx}>
                  <span className="blockPanelVarName">
                    {ReactHtmlParser(variable.varName || "")}
                  </span>
                  {variable.varDesc ? (
                    <span className="blockPanelVarDesc">
                      {ReactHtmlParser(variable.varDesc)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        )}

        {task?.image && (
          <section className="blockPanelSection">
            <h2>{t("viewer.screenshot", {}, { default: "Screenshot" })}</h2>
            <img src={task?.image} alt="" />
          </section>
        )}

        {settings?.scoring && (
          <section className="blockPanelSection">
            <h2>{t("viewer.scoring", {}, { default: "Scoring" })}</h2>
            <div className="blockPanelMuted">
              {ReactHtmlParser(settings?.scoring)}
            </div>
          </section>
        )}

        {settings?.descriptionBefore && (
          <section className="blockPanelSection">
            <h2>
              {t("viewer.seeBefore", {}, {
                default: "What participants see before",
              })}
            </h2>
            <div className="blockPanelParticipantCard">
              <p>{settings?.descriptionBefore}</p>
            </div>
          </section>
        )}

        {settings?.descriptionAfter && (
          <section className="blockPanelSection">
            <h2>
              {t("viewer.seeAfter", {}, {
                default: "What participants see after",
              })}
            </h2>
            <div className="blockPanelParticipantCard">
              <p>{settings?.descriptionAfter}</p>
            </div>
          </section>
        )}

        {parameters.length > 0 && (
          <section className="blockPanelSection blockPanelCard">
            <h2>{t("viewer.parameters", {}, { default: "Parameters" })}</h2>
            <p className="blockPanelMuted">
              {t(
                "viewer.tweakableFeatures",
                { taskType },
                {
                  default:
                    "The following features of this {{taskType}} can be tweaked:",
                }
              )}
            </p>
            <ul className="blockPanelList">
              {parameters.map((parameter, num) => (
                <li key={num}>
                  <strong>{parameter.help}</strong>
                  <div className="blockPanelMuted">
                    {ReactHtmlParser(parameter.value)}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {surveyItems.length > 0 && (
          <section className="blockPanelSection">
            <h2>
              {t("viewer.surveyParameters", {}, {
                default: "Survey parameters",
              })}
            </h2>
            <ul className="blockPanelList">
              {surveyItems.map((item, num) => (
                <li key={num}>
                  <strong>{surveyItemLabel(item)}</strong>
                  <div>{ReactHtmlParser(item?.header)}</div>
                  <div className="blockPanelMuted">
                    {ReactHtmlParser(item?.text)}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {resources.length > 0 && (
          <section className="blockPanelSection">
            <h2>
              {t("viewer.references", {}, { default: "References" })}
            </h2>
            <ul className="blockPanelReferences">
              {resources.map((resource, num) => (
                <li key={num}>{ReactHtmlParser(resource)}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
