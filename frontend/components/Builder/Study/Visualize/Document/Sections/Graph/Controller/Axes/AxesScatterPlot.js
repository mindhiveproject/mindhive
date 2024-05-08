import SelectOne from "../Fields/SelectOne";
import ToggleOne from "../Fields/ToggleOne";

export default function AxesScatterPlot({
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
html_output = js.document.getElementById('figure-${sectionId}')
X = js.document.getElementById("xVariable-${sectionId}").value
Y = js.document.getElementById("yVariable-${sectionId}").value
Group = js.document.getElementById("groupVariable-${sectionId}").value

trendline         = js.document.getElementById("trendLine-${sectionId}").checked
legend_title_text = js.document.getElementById("legend_title_text-${sectionId}").value
`;

  const options = [
    ...variables.map((variable) => ({
      key: variable?.field,
      value: variable?.field,
      text: variable?.displayName || variable?.field,
    })),
  ];

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
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="X-Axis"
        parameter="xVariable"
      />
      <SelectOne
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
      />
      <ToggleOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="Trend line"
        parameter="trendLine"
      />
    </div>
  );
}
