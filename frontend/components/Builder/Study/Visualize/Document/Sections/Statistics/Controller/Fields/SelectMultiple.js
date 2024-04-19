import { Dropdown } from "semantic-ui-react";
import { useState, useEffect } from "react";

export default function SelectMultiple({
  sectionId,
  options,
  onSelectorChange,
  title,
  parameter,
}) {
  const [selected, setSelected] = useState([]);

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
        />
        <input
          type="hidden"
          id={`${parameter}-${sectionId}`}
          value={JSON.stringify(selected)}
        />
      </div>
    </div>
  );
}
