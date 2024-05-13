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
html_output = js.document.getElementById('figure-${sectionId}')
#X = js.document.getElementById("xVariable-${sectionId}").value############################################################################################################


import json
Xmultiple = js.document.getElementById("xVariableMultiple-${sectionId}")
xMultiple_value_json = json.loads(Xmultiple.value)
columns = xMultiple_value_json

legend_title_text = js.document.getElementById('legend_title_text-${sectionId}').value`;

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
    <div className="selectors">
      <div className="header">
        <img src={`/assets/icons/visualize/axes.svg`} />
        <div>Axes</div>
      </div>
      <SelectMultiple
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="Column(s) to observe"
        parameter="xVariableMultiple"
      />
    </div>
  );
}
