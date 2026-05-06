"use client";

import { useEffect, useMemo, useState } from "react";

import useTranslation from "next-translate/useTranslation";

import { Table } from "semantic-ui-react";

import DropdownSelect from "../../../../../../../DesignSystem/DropdownSelect";
import { StyledForm } from "../../../../../../../styles/StyledForm";

const M = "dataJournal.datasetMenu.addColumnModal";

export default function Recode({
  data,
  variables,
  variablesOptions,
  inputs,
  handleChange,
  updateDataset,
  submitRef,
  onSuccess,
}) {
  const { t } = useTranslation("builder");
  const [uniqueValues, setUniqueValues] = useState([]);
  const [replacementValues, setReplacementValues] = useState({});

  const variableSelectOptions = useMemo(
    () =>
      (variablesOptions || [])
        .map((o) => ({
          value: String(o.value ?? ""),
          label: String(o.text ?? o.value ?? ""),
        }))
        .filter((o) => o.value !== ""),
    [variablesOptions],
  );

  const sourceVariableLabel = t(`${M}.labels.variableToRecode`, {}, {
    default: "Select variable to recode",
  });

  const variablePlaceholder = t(`${M}.placeholders.selectVariable`, {}, {
    default: "Select variable",
  });

  const variableAria = t(`${M}.aria.variableToRecode`, {}, {
    default: "Variable to recode",
  });

  useEffect(() => {
    if (inputs?.oldVariable) {
      const uniqueVals = [
        ...new Set(data.map((row) => row[inputs?.oldVariable])),
      ];
      const filteredUniqueVals = uniqueVals.filter((value) => value !== "");
      setUniqueValues(filteredUniqueVals);
      const initialReplacements = filteredUniqueVals.reduce(
        (acc, val) => ({ ...acc, [val]: val }),
        {},
      );
      setReplacementValues(initialReplacements);
    }
  }, [inputs?.oldVariable, data]);

  useEffect(() => {
    submitRef.current = () => {
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
      onSuccess();
    };
    return () => {
      submitRef.current = null;
    };
  }, [
    data,
    variables,
    inputs,
    replacementValues,
    updateDataset,
    onSuccess,
    submitRef,
  ]);

  const oldVarValue =
    inputs?.oldVariable != null && inputs.oldVariable !== ""
      ? String(inputs.oldVariable)
      : "";

  return (
    <StyledForm>
      <fieldset>
        <label htmlFor="name">New variable name</label>
        <input
          type="text"
          name="name"
          value={inputs?.name}
          onChange={handleChange}
        />

        <label>{sourceVariableLabel}</label>
        <DropdownSelect
          ariaLabel={variableAria}
          placeholder={variablePlaceholder}
          value={oldVarValue}
          onChange={(next) =>
            handleChange({
              target: { name: "oldVariable", value: next },
            })
          }
          options={variableSelectOptions}
          searchableSingle
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
              <Table.Row key={String(value)}>
                <Table.Cell>{value}</Table.Cell>
                <Table.Cell>
                  <input
                    type="text"
                    value={replacementValues[value] ?? ""}
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
  );
}
