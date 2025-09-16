import { useState, useEffect } from "react";
import styled from "styled-components";

const StyledSurveyBuilderItemLine = styled.div`
  padding-top: 16px;
  padding-bottom: 16px;
  padding-left: 16px;
  display: grid;
  grid-template-columns: 9fr 1fr;
  grid-column-gap: 10px;
  .controlButtons {
    display: grid;
  }
  .deleteDiv {
    display: grid;
    align-self: start;
    justify-self: end;
  }
  .moveButtons {
    display: grid;
    align-self: end;
    justify-self: end;
    button {
      background-color: orange;
      :hover {
        background-color: #d9b616;
        transform: scale(1.1);
        transition: transform 0.5s;
      }
    }
  }
  button {
    cursor: pointer;
    width: 4.3rem;
    text-align: center;
    border-radius: 2.25rem;
    background-color: #ff2d2d;
    color: white;
    font-size: 2rem;
    :hover {
      background-color: #ea0707;
      transform: scale(1.1);
      transition: transform 0.5s;
    }
  }
  textarea {
    height: 120px;
  }
  .optionRow {
    display: grid;
    grid-template-columns: 9fr 1fr;
    grid-column-gap: 10px;
  }
  .addOptionButton {
    cursor: pointer;
    width: 10rem;
    text-align: center;
    border-radius: 3rem;
    background-color: #a78803;
    color: white;
    font-size: 1.5rem;
    :hover {
      background-color: #e5bc0c;
      transform: scale(1.1);
      transition: transform 0.5s;
    }
  }
`;

export default function ObjectBuilder({ name, content, onChange, title }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (content) {
      try {
        const parsed = JSON.parse(content);
        setItems(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        console.error("Invalid JSON in ObjectBuilder:", err);
        setItems([]);
      }
    }
  }, [content]);

  const packTheObject = (value) => ({
    target: {
      name,
      type: "array",
      value: JSON.stringify(value),
    },
  });

  const updateProps = (items) => {
    onChange(packTheObject(items));
  };

  const handleChange = (index, field, value) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
    updateProps(updatedItems);
  };

  const addItem = (e) => {
    e.preventDefault();
    const updatedItems = [...items, { varName: "", varDesc: "" }];
    setItems(updatedItems);
    updateProps(updatedItems);
  };

  const deleteItem = (e, index) => {
    e.preventDefault();
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    updateProps(updatedItems);
  };

  return (
    <div>
      {items.length > 0 &&
        items.map((item, index) => (
          <Item
            key={index}
            id={index}
            item={item}
            title={title}
            handleChange={handleChange}
            deleteItem={deleteItem}
          />
        ))}
      <button className="addButton" onClick={addItem}>
        + Add
      </button>
    </div>
  );
}

const Item = ({ id, item, title, handleChange, deleteItem }) => {
  return (
    <StyledSurveyBuilderItemLine>
      <div className="input">
        <div>{title}</div>
        <input
          type="text"
          placeholder=""
          style={{ marginBottom: "10px" }}
          value={item.varName || ""}
          onChange={(e) => handleChange(id, "varName", e.target.value)}
          className="element"
        />
        <input
          type="text"
          placeholder=""
          value={item.varDesc || ""}
          onChange={(e) => handleChange(id, "varDesc", e.target.value)}
          className="element"
        />
      </div>
      <div className="controlButtons">
        <div className="deleteDiv">
          <button onClick={(e) => deleteItem(e, id)}>&times;</button>
        </div>
      </div>
    </StyledSurveyBuilderItemLine>
  );
};
