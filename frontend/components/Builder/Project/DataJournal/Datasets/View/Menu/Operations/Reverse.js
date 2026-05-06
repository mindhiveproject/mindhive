"use client";

import { useEffect, useMemo } from "react";

import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../../../../DesignSystem/DropdownSelect";
import { StyledForm } from "../../../../../../../styles/StyledForm";

const M = "dataJournal.datasetMenu.addColumnModal";

const reverseValue = ({ column, maxValue }) => {
  const columnValue = parseFloat(column);
  if (isNaN(columnValue)) {
    return null;
  }
  return maxValue - columnValue;
};

export default function Reverse({
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

  const variableLabel = t(`${M}.labels.variableToReverse`, {}, {
    default: "Select variable to reverse",
  });

  const variablePlaceholder = t(`${M}.placeholders.selectVariable`, {}, {
    default: "Select variable",
  });

  const variableAria = t(`${M}.aria.variableToReverse`, {}, {
    default: "Variable to reverse",
  });

  useEffect(() => {
    submitRef.current = () => {
      const maxValue = parseInt(inputs?.maxValue, 10);
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
        [`${inputs?.variable}_reversed`]: reverseValue({
          column: parseFloat(row[inputs?.variable]),
          maxValue,
        }),
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
  }, [data, variables, inputs, updateDataset, onSuccess, submitRef]);

  const variableValue =
    inputs?.variable != null && inputs.variable !== ""
      ? String(inputs.variable)
      : "";

  return (
    <StyledForm>
      <fieldset>
        <label htmlFor="variable">{variableLabel}</label>
        <DropdownSelect
          ariaLabel={variableAria}
          placeholder={variablePlaceholder}
          value={variableValue}
          onChange={(next) =>
            handleChange({
              target: { name: "variable", value: next },
            })
          }
          options={variableSelectOptions}
          searchableSingle
        />
        <label htmlFor="maxValue">Enter max value of the scale</label>
        <input
          type="number"
          min={0}
          name="maxValue"
          value={inputs?.maxValue ?? ""}
          onChange={handleChange}
        />
      </fieldset>
    </StyledForm>
  );
}
