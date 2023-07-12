import { useState } from "react";

export default function Array({ name, content, onChange }) {
  const [items, setItems] = useState(JSON.parse(content) || []);

  const updateProps = (items) => {
    const packed = packTheObject(items);
    onChange(packed);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedItems = items.map((item, number) =>
      number === parseInt(name) ? value : item
    );
    setItems(updatedItems);
    updateProps(updatedItems);
  };

  const packTheObject = (value) => ({
    target: {
      name: name,
      type: "array",
      value: JSON.stringify(value),
    },
  });

  const addItem = (e) => {
    e.preventDefault();
    const updatedItems = [...items, ""];
    setItems(updatedItems);
    updateProps(updatedItems);
  };

  const deleteItem = (e, number) => {
    e.preventDefault();
    const updatedItems = items.filter((item, num) => num !== parseInt(number));
    setItems(updatedItems);
    updateProps(updatedItems);
  };

  if (items && items.length) {
    return (
      <div>
        {items.map((item, number) => (
          <Item
            item={item}
            key={number}
            id={number}
            handleItemChange={handleChange}
            deleteItem={deleteItem}
            title={title}
          />
        ))}
      </div>
    );
  }

  return (
    <button className="addButton" onClick={addItem}>
      +
    </button>
  );
}

function Item({ id, item, title }) {
  return (
    <div className="surveyBuilderItemLine">
      <div className="input">
        <>
          <div>{title || "Condition"}</div>
          <input
            type="text"
            name={id}
            value={item}
            onChange={handleItemChange}
            className="element"
          />
        </>
      </div>
      <div className="controlButtons">
        <div className="deleteDiv">
          <button onClick={(e) => deleteItem(e, id)}>&times;</button>
        </div>
      </div>
    </div>
  );
}
