import SelectOne from "../Fields/SelectOne";

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
col1 = js.document.getElementById("col1-${sectionId}").value
col2 = js.document.getElementById("col2-${sectionId}").value`;

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
      <div className="selectorsTestStats">
        <SelectOne
          sectionId={sectionId}
          options={options}
          selectors={selectors}
          onSelectorChange={onSelectorChange}
          title="Predictor Column"
          parameter="col1"
        />
        <SelectOne
          sectionId={sectionId}
          options={options}
          selectors={selectors}
          onSelectorChange={onSelectorChange}
          title="Predicted Column"
          parameter="col2"
        />
      </div>
    </div>
  );
}
