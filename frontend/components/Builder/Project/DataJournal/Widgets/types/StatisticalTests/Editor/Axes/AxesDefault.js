import SelectOne from "../Fields/SelectOne";

export default function Axes({ variables, sectionId, selectors, onChange }) {
  const connectSelectorsCode = `# get relevant html elements
html_output = js.document.getElementById('figure-${sectionId}')
X = js.document.getElementById("xVariable-${sectionId}").value
Y = js.document.getElementById("yVariable-${sectionId}").value`;

  const options = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.field,
    text: variable?.displayName || variable?.field,
  }));

  const onSelectorChange = ({ target }) => {
    onChange({
      componentId: sectionId,
      newContent: {
        selectors: { ...selectors, [target?.name]: target?.value },
      },
    });
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
