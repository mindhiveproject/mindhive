import Vas from "./Types/Vas";
import SelectOne from "./Types/SelectOne";
import SurveyBuilder from "./Types/SurveyBuilder";
import Array from "./Types/Array";

export default function TaskParameters({ task, handleChange }) {
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

  if (parameters.length === 0) {
    return (
      <div>
        <label>Template parameters</label>
        {!task?.template?.file && <p>Please upload a lab.js json file first</p>}
        {task?.template?.file && (
          <p>The template does not contain any parameters.</p>
        )}
      </div>
    );
  }

  return (
    <fieldset>
      <label>Task parameters</label>
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
      <div>
        <button onClick={setParametersFromTemplate}>
          Get parameters from the template
        </button>
      </div>
    </fieldset>
  );
}
