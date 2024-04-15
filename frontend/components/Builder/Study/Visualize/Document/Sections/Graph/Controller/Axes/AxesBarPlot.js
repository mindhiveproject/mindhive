import SelectOne from "../Fields/SelectOne";
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
  const connectSelectorsCode = `
import json
plot_output = js.document.getElementById('figure-${sectionId}')

Xmultiple = js.document.getElementById("xVariableMultiple-${sectionId}")
xMultiple_value_json = json.loads(Xmultiple.value)
columns = xMultiple_value_json

x_labels= columns ###################################################### To change to list under x axis

#Y = js.document.getElementById("yVariable-${sectionId}").value
#Group = js.document.getElementById("groupVariable-${sectionId}").value`;

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
    const value = Array.isArray(target?.value) ? target?.value : [target?.value];
    console.log(value)
    handleContentChange({
      newContent: {
        selectors: { ...selectors, [target?.name]: value },
      },
    });
    updateCode({ code });
  };
  

  return (
    <div className="selectors">
      <SelectMultiple
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="X-Axis"
        parameter="xVariableMultiple"
      />
      {/* <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="Y-Axis"
        parameter="yVariable"
        />
        <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="Group"
        parameter="groupVariable"
      /> */}
    </div>
  );
}
