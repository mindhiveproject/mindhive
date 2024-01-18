export default function Selector({ variables, code, runCode }) {
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
            id="X-variable"
            onChange={() => {
              runCode({ code });
            }}
          >
            {options.map((option) => (
              <option value={option?.value}>{option?.text}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="selectorLine">
        <div className="title">Y-Axis</div>
        <div className="select">
          <select
            id="Y-variable"
            onChange={() => {
              runCode({ code });
            }}
          >
            {options.map((option) => (
              <option value={option?.value}>{option?.text}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="selectorLine">
        <div className="title">Group</div>
        <div className="select">
          <select
            id="Group-variable"
            onChange={() => {
              runCode({ code });
            }}
          >
            {options.map((option) => (
              <option value={option?.value}>{option?.text}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
