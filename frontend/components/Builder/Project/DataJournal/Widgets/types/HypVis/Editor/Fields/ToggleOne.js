import { Dropdown } from "semantic-ui-react";
import { useState, useEffect } from "react";
import TruncatedTooltipText from "../../../_shared/TruncatedTooltipText";

export default function SelectMultiple({
  sectionId,
  options,
  selectors,
  onSelectorChange,
  title,
  parameter,
}) {
  const [selected, setSelected] = useState(selectors[parameter] || []);

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
      <TruncatedTooltipText as="div" className="title" text={title} />
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
