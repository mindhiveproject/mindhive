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
X = js.document.getElementById("xVariable-${sectionId}").value
Y = js.document.getElementById("yVariable-${sectionId}").value`;

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
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="1st Column"
        parameter="xVariable"
      />
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="2nd Column"
        parameter="yVariable"
      />
    </div>
  );
}
