import { Modal, Dropdown } from "semantic-ui-react";

import { StyledForm } from "../../../../../../../styles/StyledForm";

export default function Reverse({
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
  const reverse = ({ column, maxValue }) => {
    const columnValue = parseFloat(column);
    if (isNaN(columnValue)) {
      return null;
    }
    return maxValue - columnValue;
  };

  const reverseColumn = () => {
    const maxValue = parseInt(inputs?.maxValue);
    if (isNaN(maxValue)) {
      alert("Please enter a valid integer for the max value.");
      return;
    }
    const updatedVariables = [
      ...variables,
      {
        field: `${inputs?.variable}_reversed`,
        editable: true,
        type: "user",
      },
    ];
    const updatedData = data.map((row) => ({
      ...row,
      [`${inputs?.variable}_reversed`]: reverse({
        column: parseFloat(row[inputs?.variable]),
        maxValue,
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
              <label htmlFor="variable">Select variable to reverse</label>
              <Dropdown
                placeholder="Select variable"
                fluid
                search
                selection
                options={variablesOptions}
                onChange={(event, data) =>
                  handleChange({
                    target: { name: "variable", value: data?.value },
                  })
                }
              />
              <label htmlFor="maxValue">Enter max value of the scale</label>
              <input
                type="number"
                min={0}
                name="maxValue"
                value={inputs.maxValue}
                onChange={handleChange}
              />
            </fieldset>
          </StyledForm>
        </Modal.Description>
      </Modal.Content>

      <Modal.Actions>
        <div className="modalButtons">
          <button className="secondaryBtn" onClick={() => reverseColumn()}>
            Reverse
          </button>
        </div>
      </Modal.Actions>
    </>
  );
}
