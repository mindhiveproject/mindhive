import { Dropdown } from 'semantic-ui-react';
import { useState } from 'react';

const options = [ // will have to change 
//   { key: 'apple', text: 'Apple', value: 'apple' },
//   { key: 'banana', text: 'Banana', value: 'banana' },
//   { key: 'orange', text: 'Orange', value: 'orange' },
];

const fixedItems = [
  { key: 'higher', text: 'higher', value: 'higher' },
  { key: 'more', text: 'more', value: 'more' },
  { key: 'better', text: 'better', value: 'better' },
  { key: 'lower', text: 'lower', value: 'lower' },
  { key: 'less', text: 'less', value: 'less' },
  { key: 'worse', text: 'worse', value: 'worse' },
];

export default function AggregateVarSelector({ placeholder, allowAdditions, isDirectionality, onChange , value }) {
  const [items, setItems] = useState(options); // will have to change 

  const handleAddition = (e, { value }) => {
    setItems((prevItems) => [
      ...prevItems,
      { key: value, text: value, value },
    ]);
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