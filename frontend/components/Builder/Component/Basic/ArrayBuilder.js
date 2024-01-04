import { useState, useEffect } from "react";
import styled from "styled-components";

const StyledSurveyBuilderItemLine = styled.div`
  border-bottom: 3px #e7d6d6 solid;
  padding-bottom: 30px;
  margin-bottom: 30px;
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

export default function ArrayBuilder({ name, content, onChange, title }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function parseContent() {
      setItems(JSON.parse(content));
    }
    if (content) {
      parseContent();
    }
  }, [content]);

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
      name,
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

  if (items) {
    return (
      <div>
        {items &&
          items.length > 0 &&
          items.map((item, number) => (
            <Item
              key={number}
              id={number}
              item={item}
              handleChange={handleChange}
              deleteItem={deleteItem}
              title={title}
            />
          ))}
        <button className="addButton" onClick={addItem}>
          +
        </button>
      </div>
    );
  }
  return (
    <button className="addButton" onClick={addItem}>
      +
    </button>
  );
}

const Item = ({ id, item, title, handleChange, deleteItem }) => {
  return (
    <StyledSurveyBuilderItemLine>
      <div className="input">
        <>
          <div>{title}</div>
          <input
            type="text"
            name={id}
            value={item}
            onChange={handleChange}
            className="element"
          />
        </>
      </div>
      <div className="controlButtons">
        <div className="deleteDiv">
          <button onClick={(e) => deleteItem(e, id)}>&times;</button>
        </div>
      </div>
    </StyledSurveyBuilderItemLine>
  );
};
