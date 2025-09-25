import { useState, useEffect } from "react";

import { Modal, Dropdown, Table } from "semantic-ui-react";

import { StyledForm } from "../../../../../../../styles/StyledForm";

export default function Recode({
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
  const [uniqueValues, setUniqueValues] = useState([]);
  const [replacementValues, setReplacementValues] = useState({});

  useEffect(() => {
    if (inputs?.oldVariable) {
      const uniqueVals = [
        ...new Set(data.map((row) => row[inputs?.oldVariable])),
      ];
      const filteredUniqueVals = uniqueVals.filter((value) => value !== ""); // filter out empty strings
      setUniqueValues(filteredUniqueVals);
      const initialReplacements = filteredUniqueVals.reduce(
        (acc, val) => ({ ...acc, [val]: val }),
        {}
      );
      setReplacementValues(initialReplacements);
    }
  }, [inputs?.oldVariable, data]);

  const recode = () => {
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
      [inputs?.name]: replacementValues[row[inputs?.oldVariable]],
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

              <label>Select variable to recode</label>
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

              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Original Value</Table.HeaderCell>
                    <Table.HeaderCell>Replacement Value</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {uniqueValues.map((value) => (
                    <Table.Row key={value}>
                      <Table.Cell>{value}</Table.Cell>
                      <Table.Cell>
                        <input
                          type="text"
                          value={replacementValues[value]}
                          onChange={(e) =>
                            setReplacementValues({
                              ...replacementValues,
                              [value]: e.target.value,
                            })
                          }
                        />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </fieldset>
          </StyledForm>
        </Modal.Description>
      </Modal.Content>

      <Modal.Actions>
        <div className="modalButtons">
          <button className="secondaryBtn" onClick={() => recode()}>
            Recode
          </button>
        </div>
      </Modal.Actions>
    </>
  );
}
