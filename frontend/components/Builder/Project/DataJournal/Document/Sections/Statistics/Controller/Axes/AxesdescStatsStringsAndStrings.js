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
StringColumn = js.document.getElementById("StringColumn-${sectionId}").value
LabelColumn = js.document.getElementById("LabelColumn-${sectionId}").value
#Group = js.document.getElementById("groupVariable-${sectionId}").value
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
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="Word Column"
        parameter="StringColumn"
      />
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="Label Column"
        parameter="LabelColumn"
      />
    </div>
  );
}
