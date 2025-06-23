import Vas from "./Types/Vas";
import SelectOne from "./Types/SelectOne";
import SurveyBuilder from "./Types/SurveyBuilder";
import Array from "./Types/Array";
import useTranslation from "next-translate/useTranslation";

export default function TaskParameters({
  user,
  task,
  handleChange,
  isInStudyBuilder,
}) {
  const { t } = useTranslation("builder");
  const parameters = task?.parameters || task?.template?.parameters || [];

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
          <Array name={name} content={value} onChange={handleParameterChange} />
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
        <label>{t("parameters.templateParameters", "Template parameters")}</label>
        {!task?.template?.file && <p>{t("parameters.uploadLabjs", "Please upload a lab.js json file first")}</p>}
        {task?.template?.file && (
          <p>{t("parameters.noParameters", "The template does not contain any parameters.")}</p>
        )}
      </div>
    );
  }

  return (
    <fieldset>
      {isInStudyBuilder && (
        <>
          <div className="block">
            <label htmlFor="subtitle">
              {t("parameters.subtitle", "Subtitle")}
              <input
                type="text"
                name="subtitle"
                value={task?.subtitle}
                onChange={handleChange}
              />
            </label>
          </div>

          {task?.testId && (
            <div>
              <label>{t("parameters.versionId", "Version ID")}</label>
              <p>{task?.testId}</p>
            </div>
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
                    {t("parameters.askDataUsage", "Ask students a data usage question after the task")}
                  </label>
                </div>
              </div>
            )}
        </>
      )}

      {parameters.length > 0 && (
        <>
          <label>{t("parameters.taskParameters", "Task parameters")}</label>
          {parameters.map(
            ({ name, value, type, help, example, options, array }) => (
              <div className="wideBlock" key={name}>
                <div className="taskBlock" htmlFor={name}>
                  <div className="help">
                    <p>{name || help}</p>
                  </div>
                  {example && (
                    <div className="example">
                      <p>{example}</p>
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
              <button onClick={setParametersFromTemplate}>
                {t("parameters.getFromTemplate", "Get parameters from the template")}
              </button>
            </div>
          )}
        </>
      )}
    </fieldset>
  );
}
