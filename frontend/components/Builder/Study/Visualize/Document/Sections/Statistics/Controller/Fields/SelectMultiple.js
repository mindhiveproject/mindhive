import { Dropdown } from "semantic-ui-react";
import { useState, useEffect } from "react";

export default function SelectMultiple({
  sectionId,
  options,
  selectors,
  onSelectorChange,
  parameter,
  selectedDataFormat,
}) {
  const [selected, setSelected] = useState(selectors[parameter] || []);

  const title =
    selectedDataFormat === "quant"
      ? "Quantitative column(s)"
      : "Qualitative column(s)";

  const handleChange = (event, data) => {
    setSelected(data.value);
    onSelectorChange({
      target: {
        name: parameter,
        value: data.value,
      },
    });
  };

  return (
    <div className="selectorLine">
      <div className="title">{title}</div>
      <div className="select">
        <Dropdown
          placeholder="Select variable(s)"
          fluid
          multiple
          search
          selection
          options={options}
          onChange={handleChange}
          value={selected}
        />
        <input
          type="hidden"
          id={`${parameter}-${sectionId}`}
          value={selected}
        />
      </div>
    </div>
  );
}
