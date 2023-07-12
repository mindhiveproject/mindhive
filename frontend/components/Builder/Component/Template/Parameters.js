import { Icon } from "semantic-ui-react";
import { StyledIconSpan } from "../../../styles/StyledTaskBuilder";

export default function TemplateParameters({ template, handleChange }) {
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

  return (
    <div>
      <h2>Template parameters</h2>
      <div>
        {parameters.map(
          ({ name, value, type, help, example, options, array, icon }) => (
            <div key={name} htmlFor={name} className="parameterBlock">
              <div className="name">{name}</div>

              <div>Select the type of the parameter</div>
              <select
                type="text"
                name={name}
                value={type}
                onChange={handleTemplateParamChange}
                className="type"
              >
                <option value="string">Choose the type</option>
                <option value="textarea">Text</option>
                <option value="text">Single-line text input</option>
                <option value="number">Number</option>
                <option value="select">Select one</option>
                <option value="vas">VAS builder</option>
                <option value="survey">Survey builder</option>
              </select>

              <div>Select the icon</div>
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

              <div>
                Provide instructions for other users to understand what this
                parameter changes in the task
              </div>
              <textarea
                name={name}
                value={help}
                onChange={handleTemplateParamChange}
                className="help"
              />

              <div>An example of what can be the parameter value</div>
              <textarea
                name={name}
                value={example}
                onChange={handleTemplateParamChange}
                className="example"
              />

              {type === "select" && (
                <>
                  <div>The options (each on a new line) for this parameter</div>
                  <textarea
                    name={name}
                    value={options}
                    onChange={handleTemplateParamChange}
                    className="options"
                  />
                </>
              )}

              <div>The default value for this parameter</div>
              <textarea
                name={name}
                value={value}
                onChange={handleTemplateParamChange}
                className="value"
              />

              <button onClick={(e) => deleteTemplateParameter(e, name)}>
                Delete
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
