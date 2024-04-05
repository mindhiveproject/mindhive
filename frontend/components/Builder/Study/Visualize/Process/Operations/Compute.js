import { Modal, Dropdown } from "semantic-ui-react";

import { StyledForm } from "../../../../../styles/StyledForm";

const operations = [
  { value: "zeroState", text: "" },  
  { value: "add", text: " Addition (+) " },
  { value: "subtract", text: " Substraction (-) " },
  { value: "multiply", text: " Multiplication (x) " },
  { value: "divide", text: " Division (/) " },
  { value: "average", text: " Average (x̄) " },
];

const compute = ({ var1, var2, data, selectedVariables, operation }) => {
  switch(operation) {
    case "add":
      return (isNaN(var1) || isNaN(var2)) ? null : var1 + var2;
    case "subtract":
      console.log("var1", var1)
      console.log("var2", var2)
      console.log((isNaN(var1) || isNaN(var2)))
      return (isNaN(var1) || isNaN(var2)) ? null : var1 - var2;
    case "multiply":
      return (isNaN(var1) || isNaN(var2)) ? null : var1 * var2;
    case "divide":
      return (isNaN(var1) || isNaN(var2)) ? null : var1 / var2;
    case "average":
      if (Array.isArray(selectedVariables) && selectedVariables.length > 0) {
        // Calculate the average of selected variables, ignoring undefined values
        const validValues = selectedVariables
          .map(variable => parseFloat(data[variable]))
          .filter(value => !isNaN(value)); // Filter out NaN (undefined) values
        console.log(validValues)
        const sum = validValues.reduce((acc, value) => acc + value, 0);
        return validValues.length > 0 ? sum / validValues.length : 0;
      } else {
        return 42; // Return 0 if selectedVariables is not an array or is empty
      }
      

      // case "average":
    //   if (Array.isArray(selectedVariables) && selectedVariables.length > 0) {
    //     console.log(data)
    //     return selectedVariables.reduce((sum, variable) => sum + parseFloat(data[variable]), 0) / selectedVariables.length;
    //     // return selectedVariables.reduce((sum, variable) => sum + variable, 0) / selectedVariables.length;
    //   } else {
    //     return 2; // Return 0 if selectedVariables is not an array or is empty
    //   }

    default:
      throw new Error(`Unsupported operation: ${operation}`);
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
        data: data,
        selectedVariables: Array.isArray(inputs?.selectedVariables) ? inputs.selectedVariables : [],
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
              {inputs?.operation === "add" && (
                <div>
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
              </div>
              )}
              {inputs?.operation === "subtract" && (
                <div>
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
              </div>

              )}
              {inputs?.operation === "multiply" && (
                <div>
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
              </div>

              )}
              {inputs?.operation === "divide" && (
                <div>
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
              </div>

              )}
              {inputs?.operation === "average" && (
                <div>
                  <label>Select variable(s):</label>
                  <Dropdown
                    placeholder="Select variable(s)"
                    fluid
                    multiple
                    search
                    selection
                    options={variablesOptions}
                    onChange={(event, data) => {
                      const selectedVariables = data?.value;
                      // console.log("Selected Variables:");
                      // console.log("Selected Variables:", selectedVariables);
                      handleChange({
                        target: { name: "selectedVariables", value: selectedVariables },
                      });
                    }}
                  />

                </div>
              )}
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
