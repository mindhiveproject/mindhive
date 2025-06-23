import { Icon } from "semantic-ui-react";
import { StyledIconSpan } from "../../../styles/StyledTaskBuilder";
import useTranslation from "next-translate/useTranslation";

export default function TemplateParameters({ template, handleChange }) {
  const { t } = useTranslation("builder");
  const parameters = template?.parameters || [];

  const iconOptions = [
    "clone outline",
    "clipboard outline",
    "star outline",
    "random",
    "question circle outline",
  ];

  const handleTemplateParamChange = (e, classType) => {
    const { name, type, value, className } = e.target;
    let val = type === "number" ? parseFloat(value) : value;
    if (classType === "array") {
      val = JSON.stringify(val.split("\n"));
    }
    handleChange({
      target: {
        name: "template",
        value: {
          ...template,
          parameters: parameters.map((el) =>
            el.name === name ? { ...el, [className]: val } : el
          ),
        },
      },
    });
  };

  const deleteTemplateParameter = (e, name) => {
    e.preventDefault();
    handleChange({
      target: {
        name: "template",
        value: {
          ...template,
          parameters: parameters.filter((el) => el.name !== name),
        },
      },
    });
  };

  if (parameters.length === 0) {
    return (
      <div>
        <label>{t("template.parameters", "Template parameters")}</label>
        {!template?.file && <p>{t("template.uploadLabjs", "Please upload a lab.js json file first")}</p>}
        {template?.file && (
          <p>{t("template.noParameters", "The lab.js file does not contain any parameters.")}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <label>{t("template.parameters", "Template parameters")}</label>
      <div>
        {parameters.map(
          ({ name, value, type, help, example, options, array, icon }) => (
            <div key={name} htmlFor={name} className="parameterBlock">
              <div className="name">{name}</div>

              <div>{t("template.selectType", "Select the type of the parameter")}</div>
              <select
                type="text"
                name={name}
                value={type}
                onChange={handleTemplateParamChange}
                className="type"
              >
                <option value="string">{t("template.chooseType", "Choose the type")}</option>
                <option value="textarea">{t("template.text", "Text")}</option>
                <option value="text">{t("template.singleLine", "Single-line text input")}</option>
                <option value="number">{t("template.number", "Number")}</option>
                <option value="select">{t("template.selectOne", "Select one")}</option>
                <option value="vas">{t("template.vasBuilder", "VAS builder")}</option>
                <option value="survey">{t("template.surveyBuilder", "Survey builder")}</option>
              </select>

              <div>{t("template.selectIcon", "Select the icon")}</div>
              <div className="iconSelector">
                {iconOptions.map((iconName, num) => (
                  <StyledIconSpan
                    className="iconSpan"
                    key={num}
                    isSelected={iconName === icon}
                    onClick={() => {
                      handleTemplateParamChange(
                        {
                          target: {
                            name,
                            type: "text",
                            value: iconName,
                            className: "icon",
                          },
                        },
                        "icon"
                      );
                    }}
                  >
                    <Icon name={iconName} style={{ color: "#556AEB" }} />
                  </StyledIconSpan>
                ))}
              </div>

              <div>{t("template.instructions", "Provide instructions for other users to understand what this parameter changes in the task")}</div>
              <textarea
                name={name}
                value={help}
                onChange={handleTemplateParamChange}
                className="help"
              />

              <div>{t("template.example", "An example of what can be the parameter value")}</div>
              <textarea
                name={name}
                value={example}
                onChange={handleTemplateParamChange}
                className="example"
              />

              {type === "select" && (
                <>
                  <div>{t("template.options", "The options (each on a new line) for this parameter")}</div>
                  <textarea
                    name={name}
                    value={options}
                    onChange={handleTemplateParamChange}
                    className="options"
                  />
                </>
              )}

              <div>{t("template.defaultValue", "The default value for this parameter")}</div>
              <textarea
                name={name}
                value={value}
                onChange={handleTemplateParamChange}
                className="value"
              />

              <button onClick={(e) => deleteTemplateParameter(e, name)}>
                {t("template.delete", "Delete")}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
