import { Modal, Dropdown } from "semantic-ui-react";

import { StyledForm } from "../../../../../styles/StyledForm";

export default function Copy({
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
  const copy = () => {
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
      [inputs?.name]: row[inputs?.oldVariable],
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

              <label>Select variable to copy</label>
              <Dropdown
                placeholder="Select variable"
                fluid
                search
                selection
                options={variablesOptions}
                onChange={(event, data) =>
                  handleChange({
                    target: { name: "oldVariable", value: data?.value },
                  })
                }
              />
            </fieldset>
          </StyledForm>
        </Modal.Description>
      </Modal.Content>

      <Modal.Actions>
        <div className="modalButtons">
          <button className="secondaryBtn" onClick={() => copy()}>
            Copy
          </button>
        </div>
      </Modal.Actions>
    </>
  );
}
