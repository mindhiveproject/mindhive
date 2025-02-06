import React, { useState } from "react";
import SelectOne from "../Fields/SelectOne";

const Axes = ({
  sectionId,
  handleContentChange,
  runCode,
  pyodide,
  selectors,
}) => {
  const [groupNb, setGroupNb] = useState(2); // Default to 2 groups
  const [groupLabels, setGroupLabels] = useState({ group1: "", group2: "" });

  const handleGroupNbChange = (e) => {
    const newGroupNb = parseInt(e.target.value, 10);
    setGroupNb(newGroupNb);

    // Update group labels state
    const newGroupLabels = {};
    for (let i = 1; i <= newGroupNb; i++) {
      newGroupLabels[`group${i}`] = groupLabels[`group${i}`] || "";
    }
    setGroupLabels(newGroupLabels);
  };

  const handleGroupLabelChange = (e, group) => {
    setGroupLabels({ ...groupLabels, [group]: e.target.value });
  };

  const significanceOptions = [
    { value: "non-significant", text: "No significance" },
    { value: "significant", text: "Significant results" },
  ];

  const connectSelectorsCode = `
html_output = js.document.getElementById('figure-${sectionId}')
${Object.keys(groupLabels)
  .map(
    (group) => `
${group} = None if js.document.getElementById("${group}-${sectionId}") == None else js.document.getElementById("${group}-${sectionId}").value
`
  )
  .join("")}

group_nb = ${Object.keys(groupLabels).length}

n_samples_element = js.document.getElementById('n_samples-${sectionId}')
n_samples = None if n_samples_element is None or n_samples_element.value == '' else int(n_samples_element.value)

significanceDecision = None if js.document.getElementById("significanceDecision-${sectionId}") == None else js.document.getElementById("significanceDecision-${sectionId}").value

base_mean_element = js.document.getElementById('base_mean-${sectionId}')
base_mean = None if base_mean_element is None or base_mean_element.value == '' else float(base_mean_element.value)

effect_size_element = js.document.getElementById('effect_size-${sectionId}')
effect_size = None if effect_size_element is None or effect_size_element.value == '' else float(effect_size_element.value)
`;

  const updateCode = async ({ code }) => {
    await pyodide.runPythonAsync(connectSelectorsCode);
    if (runCode) {
      runCode({ code }); // Trigger the runCode function passed from StateManager
    }
  };
  const onSelectorChoice = (option) => {
    setSelectedDataFormat(option.value);
    onSelectorChange({ target: { name: "dataFormat", value: option?.value } });
  };

  const onSelectorChange = ({ target }) => {
    handleContentChange({
      newContent: {
        selectors: { ...selectors, [target?.name]: target?.value },
      },
    });
    updateCode({});
  };

  return (
    <div className="graphDashboard">
      <div className="header">
        <img src={`/assets/icons/visualize/axes.svg`} />
        <div>Axes (A-B Design)</div>
      </div>
      <label>
        Number of Groups:
        <input
          type="number"
          value={groupNb}
          onChange={handleGroupNbChange}
          min="2"
        />
      </label>
      {Array.from({ length: groupNb }, (_, i) => (
        <div key={i}>
          <label>
            Group {i + 1} Label:
            <input
              type="text"
              id={`group${i + 1}-${sectionId}`}
              value={groupLabels[`group${i + 1}`]}
              onChange={(e) => handleGroupLabelChange(e, `group${i + 1}`)}
            />
          </label>
        </div>
      ))}
      <SelectOne
        sectionId={sectionId}
        options={significanceOptions}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="Significance of hypothesis"
        parameter="significanceDecision"
      />
      <button
        onClick={() => updateCode({ code: 'print("Updating code from Axes")' })}
      >
        Save group settings
      </button>
    </div>
  );
};

export default Axes;
