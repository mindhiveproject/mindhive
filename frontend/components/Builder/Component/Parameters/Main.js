import Vas from "./Types/Vas";
import SelectOne from "./Types/SelectOne";
import SurveyBuilder from "./Types/SurveyBuilder";
import ArrayParameter from "./Types/Array";
import useTranslation from "next-translate/useTranslation";
import Chip from "../../../DesignSystem/Chip";

function isEmptySurveyValue(value) {
  if (value == null || value === "") return true;
  if (value === "[]") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

export default function TaskParameters({
  user,
  task,
  handleChange,
  isInStudyBuilder,
}) {
  const { t } = useTranslation("builder");
  const templateParameters = task?.template?.parameters || [];
  const rawParameters = task?.parameters?.length
    ? task.parameters
    : templateParameters;
  const parameters = rawParameters.map((parameter) => {
    const fromTemplate =
      templateParameters.find((tp) => tp.name === parameter.name) || {};
    const type =
      parameter.name === "pages" || fromTemplate.type === "survey"
        ? "survey"
        : parameter.type || fromTemplate.type;
    const value =
      type === "survey" && isEmptySurveyValue(parameter.value)
        ? fromTemplate.value ?? parameter.value
        : parameter.value;
    return {
      ...fromTemplate,
      ...parameter,
      type,
      value,
      help: parameter.help || fromTemplate.help,
      example: parameter.example || fromTemplate.example,
      options: parameter.options || fromTemplate.options,
      array: parameter.array || fromTemplate.array,
    };
  });

  const handleParameterChange = (e) => {
    const { name, type, value } = e.target;
    const val = type === "number" ? parseFloat(value) : value;
    handleChange({
      target: {
        name: "parameters",
        value: parameters.map((el) =>
          el.name === name ? { ...el, value: val } : el
        ),
      },
    });
  };

  const setParametersFromTemplate = () => {
    handleChange({
      target: {
        name: "parameters",
        value: task?.template?.parameters,
      },
    });
  };

  const renderInput = ({ name, value, type, options, array }) => {
    switch (type) {
      case "textarea":
        return (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={handleParameterChange}
          />
        );
      case "vas":
        return (
          <Vas
            name={name}
            statements={value}
            onChange={handleParameterChange}
          />
        );
      case "select":
        return (
          <SelectOne
            name={name}
            options={options}
            value={value}
            onChange={handleParameterChange}
          />
        );
      case "survey":
        return (
          <SurveyBuilder
            name={name}
            content={value}
            onChange={handleParameterChange}
          />
        );
      case "array":
        return (
          <ArrayParameter name={name} content={value} onChange={handleParameterChange} />
        );
      default:
        return (
          <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={handleParameterChange}
          />
        );
    }
  };

  if (!isInStudyBuilder && parameters.length === 0) {
    return (
      <div>
        <label>
        {t("parameters.templateParameters", {}, {
          default: "Template parameters",
        })}
        </label>
        {!task?.template?.file && (
          <p>
            {t(
              "parameters.uploadLabjs",
              {},
              { default: "Please upload a lab.js json file first" }
            )}
          </p>
        )}
        {task?.template?.file && (
          <p>
            {t(
              "parameters.noParameters",
              {},
              { default: "The template does not contain any parameters." }
            )}
          </p>
        )}
      </div>
    );
  }

  return (
    <fieldset>
      {isInStudyBuilder && (
        <>
          <section className="blockPanelSection">
            <div className="onLineHeader">
              <h2>{t("parameters.subtitle", {}, { default: "Subtitle" })}</h2>
              <input
                type="text"
                id="subtitle"
                name="subtitle"
                value={task?.subtitle ?? ""}
                onChange={handleChange}
              />
            </div>
          </section>

          {task?.testId && (
            <section className="blockPanelSection">
              <div className="onLineHeader">
                <h2>
                  {t("parameters.versionId", {}, { default: "Version ID" })}
                </h2>
                <Chip
                  variant="static"
                  tone="neutral"
                  label={task.testId}
                  truncate={false}
                />
              </div>
            </section>
          )}

          {user &&
            user?.permissions.map((p) => p?.name).includes("SCIENTIST") && (
              <div className="hideContinueBtn">
                <div>
                  <input
                    type="checkbox"
                    id="askDataUsageQuestion"
                    name="askDataUsageQuestion"
                    checked={task?.askDataUsageQuestion}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="askDataUsageQuestion">
                    {t(
                      "parameters.askDataUsage",
                      {},
                      {
                        default:
                          "Ask students a data usage question after the task",
                      }
                    )}
                  </label>
                </div>
              </div>
            )}
        </>
      )}

      {parameters.length > 0 && (
        <>
          <section className="blockPanelSection">
            <h2>
              {t("parameters.taskParameters", {}, {
                default: "Task parameters",
              })}
            </h2>
          </section>
          {parameters.map(
            ({ name, value, type, help, example, options, array }) => (
              <div className="wideBlock" key={name}>
                <div className="taskBlock">
                  {help && <div className="help">{help}</div>}
                  {name && (
                    <div className="example">
                      {t("parameters.paramName", { name }, {
                        default: "Name: {{name}}",
                      })}
                    </div>
                  )}
                  {example && (
                    <div className="example">
                      {t("parameters.paramExample", { example }, {
                        default: "Example: {{example}}",
                      })}
                    </div>
                  )}

                  <div className="input">
                    {renderInput({ type, name, value, options, array })}
                  </div>
                </div>
              </div>
            )
          )}
          {!isInStudyBuilder && (
            <div>
              <button className="secondaryActionBtn" onClick={setParametersFromTemplate}>
                {t(
                  "parameters.getFromTemplate",
                  {},
                  { default: "Get parameters from the template" }
                )}
              </button>
            </div>
          )}
        </>
      )}
    </fieldset>
  );
}
