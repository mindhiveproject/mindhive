export default function Selector({
  variables,
  code,
  runCode,
  sectionId,
  selectors,
  handleChange,
}) {
  const options = variables.map((variable) => ({
    key: variable,
    value: variable,
    text: variable,
  }));

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
              runCode({ code });
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
              runCode({ code });
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
              runCode({ code });
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
