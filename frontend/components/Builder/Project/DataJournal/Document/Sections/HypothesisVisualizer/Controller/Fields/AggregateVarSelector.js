import { Dropdown } from 'semantic-ui-react';
import { useState } from 'react';

const fixedItems = [
  { key: 'higher', text: 'higher', value: 'higher' },
  { key: 'more', text: 'more', value: 'more' },
  { key: 'better', text: 'better', value: 'better' },
  { key: 'lower', text: 'lower', value: 'lower' },
  { key: 'less', text: 'less', value: 'less' },
  { key: 'worse', text: 'worse', value: 'worse' },
];

export default function AggregateVarSelector({ 
  placeholder, 
  allowAdditions, 
  optionsAggVar,
  isDirectionality, 
  onChange, 
  value,
 }) 
 {
  
  const [items, setItems] = useState(optionsAggVar);
  
  const handleAddition = (e, { value }) => {
    setItems((prevItems) => [
      ...(prevItems || []),
      { key: value, text: value, value },
    ]);
    console.log(items);
  };

  return (
    <Dropdown
      options={isDirectionality ? fixedItems : items}
      placeholder={placeholder}
      search
      selection
      allowAdditions={allowAdditions}
      onAddItem={handleAddition}
      value={value}
      onChange={onChange}
      className="a-blank"
    />
  );
}