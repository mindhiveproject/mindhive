import React from 'react'
import { Checkbox } from 'semantic-ui-react'

export default function ToggleOne({
  sectionId,
  selectors,
  onSelectorChange,
  title,
  parameter,
}) {
  const onToggleChange = (event, data) => {
    onSelectorChange({
      target: {
        name: parameter,
        value: data.checked, 
      },
    });
  };

  return (
    <div className="selectorLine">
      <div className="title">{title}</div>
      <div className="select" style={{ display: 'flex', justifyContent: 'left', alignItems: 'center' , marginLeft: '10px'}}>
        <Checkbox
          toggle
          id={`${parameter}-${sectionId}`}
          name={parameter}
          onChange={onToggleChange}
          checked={selectors[parameter]} 
        />
      </div>
    </div>
  );
}

