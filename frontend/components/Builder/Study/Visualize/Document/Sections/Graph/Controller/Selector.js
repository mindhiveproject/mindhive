export default function Selector({
  variables,
  code,
  pyodide,
  runCode,
  sectionId,
  selectors,
  handleChange,
}) {
  const connectSelectorsCode = `# get relevant html elements
plot_output = js.document.getElementById('figure-${sectionId}')
X = js.document.getElementById("X-variable-${sectionId}").value
Y = js.document.getElementById("Y-variable-${sectionId}").value
Group = js.document.getElementById("Group-variable-${sectionId}").value`;

  const options = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.field,
    text: variable?.displayName || variable?.field,
  }));

  const updateCode = async ({ code }) => {
    await pyodide.runPythonAsync(connectSelectorsCode);
    runCode({ code });
  };

  return (
    <div className="selectors">
      <div className="selectorLine">
        <div className="title">X-Axis</div>
        <div className="select">
          <select
            id={`X-variable-${sectionId}`}
            onChange={({ target }) => {
              handleChange({
                name: "selectors",
                content: { ...selectors, "X-variable": target.value },
              });
              updateCode({ code });
            }}
          >
            {options.map((option, num) => (
              <option
                value={option?.value}
                selected={option?.value === selectors["X-variable"]}
                key={num}
              >
                {option?.text}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="selectorLine">
        <div className="title">Y-Axis</div>
        <div className="select">
          <select
            id={`Y-variable-${sectionId}`}
            onChange={({ target }) => {
              handleChange({
                name: "selectors",
                content: { ...selectors, "Y-variable": target.value },
              });
              updateCode({ code });
            }}
          >
            {options.map((option, num) => (
              <option
                value={option?.value}
                selected={option?.value === selectors["Y-variable"]}
                key={num}
              >
                {option?.text}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="selectorLine">
        <div className="title">Group</div>
        <div className="select">
          <select
            id={`Group-variable-${sectionId}`}
            onChange={({ target }) => {
              handleChange({
                name: "selectors",
                content: { ...selectors, "Group-variable": target.value },
              });
              updateCode({ code });
            }}
          >
            {options.map((option, num) => (
              <option
                value={option?.value}
                selected={option?.value === selectors["Group-variable"]}
                key={num}
              >
                {option?.text}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
