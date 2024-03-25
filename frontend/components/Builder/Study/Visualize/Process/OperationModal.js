import { useState } from "react";

import { Modal, Dropdown } from "semantic-ui-react";

import StyledModal from "../../../../styles/StyledModal";
import useForm from "../../../../../lib/useForm";
import { StyledForm } from "../../../../styles/StyledForm";

export default function OperationModal({ variables, addNewColumn }) {
  const [isOpen, setIsOpen] = useState(false);

  const { inputs, handleChange, resetForm } = useForm({ name: "" });

  const add = () => {
    addNewColumn({
      columnName: inputs?.name,
      oldVariable: inputs?.oldVariable,
    });
    setIsOpen(false);
    resetForm();
  };

  const variablesOptions = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.field,
    text: variable?.field,
  }));

  return (
    <Modal
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
      open={isOpen}
      trigger={<button>Add column</button>}
      dimmer="blurring"
      size="small"
      closeIcon
    >
      <StyledModal>
        <Modal.Header>
          <h2>Add new column</h2>
        </Modal.Header>

        <Modal.Content>
          <Modal.Description>
            <StyledForm>
              <fieldset>
                <Dropdown
                  placeholder="Select column"
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

                <label htmlFor="name">
                  New column name
                  <input
                    type="text"
                    name="name"
                    value={inputs?.name}
                    onChange={handleChange}
                  />
                </label>
              </fieldset>
            </StyledForm>
          </Modal.Description>
        </Modal.Content>

        <Modal.Actions>
          <div className="modalButtons">
            <button className="secondaryBtn" onClick={() => setIsOpen(false)}>
              Close
            </button>

            <button className="secondaryBtn" onClick={() => add()}>
              Add
            </button>
          </div>
        </Modal.Actions>
      </StyledModal>
    </Modal>
  );
}
