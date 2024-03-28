import { Modal, Dropdown } from "semantic-ui-react";

import { StyledForm } from "../../../../../styles/StyledForm";

const operations = [
  { value: "add", text: " + " },
  { value: "subtract", text: " - " },
  { value: "multiply", text: " x " },
  { value: "divide", text: " / " },
];

const compute = ({ var1, var2, operation }) => {
  switch (operation) {
    case "add":
      return var1 + var2;
    case "subtract":
      return var1 - var2;
    case "multiply":
      return var1 * var2;
    case "divide":
      return var1 / var2;
  }
};

export default function Compute({
  title,
  data,
  variables,
  variablesOptions,
  inputs,
  handleChange,
  updateDataset,
  setIsOpen,
  resetForm,
}) {
  const operationOptions = operations.map((operation) => ({
    key: operation?.value,
    value: operation?.value,
    text: operation?.text,
  }));

  const calculate = () => {
    const updatedVariables = [
      ...variables,
      {
        field: inputs?.name,
        editable: true,
        type: "user",
      },
    ];
    const updatedData = data.map((row) => ({
      ...row,
      [inputs?.name]: compute({
        var1: parseFloat(row[inputs?.variable1]),
        var2: parseFloat(row[inputs?.variable2]),
        operation: inputs?.operation,
      }),
    }));
    updateDataset({
      updatedVariables,
      updatedData,
    });
    setIsOpen(false);
    resetForm();
  };
  return (
    <>
      <Modal.Header>
        <h2>{title}</h2>
      </Modal.Header>

      <Modal.Content>
        <Modal.Description>
          <StyledForm>
            <fieldset>
              <label htmlFor="name">New variable name</label>
              <input
                type="text"
                name="name"
                value={inputs?.name}
                onChange={handleChange}
              />

              <label>First variable</label>
              <Dropdown
                placeholder="Select variable"
                fluid
                search
                selection
                options={variablesOptions}
                onChange={(event, data) =>
                  handleChange({
                    target: { name: "variable1", value: data?.value },
                  })
                }
              />

              <label>Operation</label>
              <Dropdown
                placeholder="Select operation"
                fluid
                search
                selection
                options={operationOptions}
                onChange={(event, data) =>
                  handleChange({
                    target: { name: "operation", value: data?.value },
                  })
                }
              />

              <label>Second variable</label>
              <Dropdown
                placeholder="Select variable"
                fluid
                search
                selection
                options={variablesOptions}
                onChange={(event, data) =>
                  handleChange({
                    target: { name: "variable2", value: data?.value },
                  })
                }
              />
            </fieldset>
          </StyledForm>
        </Modal.Description>
      </Modal.Content>

      <Modal.Actions>
        <div className="modalButtons">
          <button className="secondaryBtn" onClick={() => calculate()}>
            Compute
          </button>
        </div>
      </Modal.Actions>
    </>
  );
}
