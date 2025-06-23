import styled from "styled-components";
import { Popup, Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import ArrayBuilder from "./ArrayBuilder";

const StyledSettingsBlock = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 24px 1fr;
  grid-gap: 16px;
  justify-items: start;
  border-radius: 5px;
`;

const StyledParameterBlock = styled.div`
  display: grid;
  grid-gap: 0.5rem;

  margin-top: 10px;
  .help {
    font-weight: 500;
  }
  .example {
    font-weight: 500;
  }
  .value {
    font-weight: 500;
  }
  .name {
    font-size: 1.5rem;
    color: lightslategrey;
    font-weight: 900;
    justify-self: start;
    margin: 2rem 0rem 1rem 0rem;
  }
  .input {
    max-width: 800px;
  }
  textarea {
    height: 120px;
  }
  button {
    background: white;
    color: #aa4747;
    width: fit-content;
    border: 1px solid grey;
  }
  .iconSelector {
    display: grid;
    grid-template-columns: repeat(auto-fill, 50px);
    align-items: center;
    justify-items: center;
  }
`;

export default function SettingBlock({ name, value, handleChange, task }) {
  const { t } = useTranslation("builder");
  const taskType = task?.taskType?.toLowerCase();

  const onChange = (e) => {
    const { name, type } = e.target;
    const value = type === "checkbox" ? e.target.checked : e.target.value;
    const settings = { ...task?.settings };
    settings[name] = value;
    handleChange({ target: { name: "settings", value: settings } });
  };

  if (name === "mobileCompatible") {
    return (
      <StyledSettingsBlock key={name} htmlFor={name}>
        <div className="input" style={{ width: "30px" }}>
          <input
            type="checkbox"
            id={name}
            name={name}
            checked={value}
            onChange={onChange}
          />
        </div>
        <div style={{ display: "grid" }}>
          <label className="name" htmlFor={name}>
            {t("mobileCompatible", { taskType })}
          </label>
        </div>
      </StyledSettingsBlock>
    );
  }
  if (name === "duration") {
    return (
      <StyledParameterBlock key={name} htmlFor={name}>
        <div className="input">
          <label>{t("duration")}</label>
          <Popup
            content={
              <p>
                {t("durationHelp", { taskType })}
              </p>
            }
            trigger={<Icon name="question circle outline" />}
          />
          <input
            type="text"
            id={name}
            name={name}
            value={value}
            onChange={onChange}
          />
        </div>
      </StyledParameterBlock>
    );
  }
  if (name === "resources") {
    return (
      <StyledParameterBlock key={name} htmlFor={name}>
        <div className="input">
          <label>{t("resources")}</label>
          <ArrayBuilder
            name={name}
            content={value}
            onChange={onChange}
            title={t("resource")}
          />
        </div>
      </StyledParameterBlock>
    );
  }

  if (name === "aggregateVariables") {
    return (
      <StyledParameterBlock key={name} htmlFor={name}>
        <div className="input">
          <label>{t("aggregateVariables")}</label>
          <ArrayBuilder
            name={name}
            content={value}
            onChange={onChange}
            title={t("variable")}
          />
        </div>
      </StyledParameterBlock>
    );
  }
  return (
    <StyledParameterBlock key={name} htmlFor={name}>
      {name === "descriptionBefore" && (
        <>
          <p>{t("descriptionBefore", { taskType })}</p>
          <Popup
            content={<p>{t("descriptionBeforeHelp", { taskType })}</p>}
            trigger={<Icon name="question circle outline" />}
          />
        </>
      )}
      {name === "descriptionAfter" && (
        <>
          <p>{t("descriptionAfter", { taskType })}</p>
          <Popup
            content={<p>{t("descriptionAfterHelp", { taskType })}</p>}
            trigger={<Icon name="question circle outline" />}
          />
        </>
      )}
      {name === "background" && (
        <>
          <p>{t("background")}</p>
          <Popup
            content={t("backgroundHelp")}
            trigger={<Icon name="question circle outline" />}
          />
        </>
      )}
      {name === "scoring" && <p>{t("scoringSurvey")}</p>}
      {name === "format" && (
        <>
          <p>{t("formatSurvey")}</p>
          <Popup
            content={<p>{t("formatSurveyHelp")}</p>}
            trigger={<Icon name="question circle outline" />}
          />
        </>
      )}
      {name === "addInfo" && <p>{t("addInfo")}</p>}
      <div className="input">
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          rows="5"
        />
      </div>
      {name === "descriptionBefore" && (
        <span>{t("descriptionBeforeVisible")}</span>
      )}
      {name === "descriptionAfter" && (
        <span>{t("descriptionAfterVisible")}</span>
      )}
    </StyledParameterBlock>
  );
}
