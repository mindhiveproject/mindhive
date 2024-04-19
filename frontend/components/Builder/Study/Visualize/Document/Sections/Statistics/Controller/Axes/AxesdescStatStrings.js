import SelectMultiple from "../Fields/SelectMultiple";

export default function Axes({
  type,
  variables,
  code,
  pyodide,
  runCode,
  sectionId,
  selectors,
  handleContentChange,
}) {
  const connectSelectorsCode = `# get relevant html elements
import json
plot_output = js.document.getElementById('figure-${sectionId}')
Xmultiple = js.document.getElementById("xVariableMultiple-${sectionId}")
xMultiple_value_json = json.loads(Xmultiple.value)
columns = xMultiple_value_json
`;

  const options = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.field,
    text: variable?.displayName || variable?.field,
  }));

  const updateCode = async ({ code }) => {
    await pyodide.runPythonAsync(connectSelectorsCode);
    runCode({ code });
  };

  const onSelectorChange = ({ target }) => {
    handleContentChange({
      newContent: {
        selectors: { ...selectors, [target?.name]: target?.value },
      },
    });
    updateCode({ code });
  };

  return (
    <div className="selectorsStats">
      <SelectMultiple
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="Column(s) to summarize"
        parameter="xVariableMultiple"
      />
    </div>
  );
}
