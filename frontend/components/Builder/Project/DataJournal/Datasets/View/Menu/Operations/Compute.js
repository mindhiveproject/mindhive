"use client";

import { useEffect, useMemo } from "react";

import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../../../../DesignSystem/DropdownSelect";
import { StyledForm } from "../../../../../../../styles/StyledForm";

const M = "dataJournal.datasetMenu.addColumnModal";

const operations = [
  { value: "zeroState", text: "" },
  { value: "add", text: " Addition (+) " },
  { value: "subtract", text: " Subtraction (-) " },
  { value: "multiply", text: " Multiplication (x) " },
  { value: "divide", text: " Division (/) " },
  { value: "average", text: " Average (x̄) " },
];

const roundNumber = ({ num, digits }) => {
  if (digits < 0) {
    digits = 0;
  }
  const mult = 10 ** digits;
  return Math.round(num * mult) / mult;
};

const computeValue = ({ operation, var1, var2, row, selectedVariables }) => {
  switch (operation) {
    case "add":
      return isNaN(var1) || isNaN(var2) ? null : var1 + var2;
    case "subtract":
      return isNaN(var1) || isNaN(var2) ? null : var1 - var2;
    case "multiply":
      return isNaN(var1) || isNaN(var2) ? null : var1 * var2;
    case "divide":
      return isNaN(var1) || isNaN(var2) ? null : var1 / var2;
    case "average":
      if (Array.isArray(selectedVariables) && selectedVariables.length > 0) {
        const validValues = selectedVariables
          .map((variable) => parseFloat(row[variable]))
          .filter((value) => !isNaN(value));
        const sum = validValues.reduce((acc, value) => acc + value, 0);
        if (validValues.length > 0) {
          const num = sum / validValues.length;
          return roundNumber({ num, digits: 2 });
        }
        return null;
      }
      return null;

    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
};

export default function Compute({
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

  const operationSelectOptions = useMemo(
    () =>
      operations
        .filter((o) => o.value !== "zeroState")
        .map((o) => ({
          value: o.value,
          label: (o.text || "").trim() || o.value,
        })),
    [],
  );

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

  const operationPlaceholder = t(`${M}.placeholders.selectOperation`, {}, {
    default: "Select operation",
  });

  const variablePlaceholder = t(`${M}.placeholders.selectVariable`, {}, {
    default: "Select variable",
  });

  const variablesMultiPlaceholder = t(`${M}.placeholders.selectVariables`, {}, {
    default: "Select variable(s)",
  });

  const operationAria = t(`${M}.aria.operation`, {}, { default: "Operation" });
  const firstVarAria = t(`${M}.aria.firstVariable`, {}, {
    default: "First variable",
  });
  const secondVarAria = t(`${M}.aria.secondVariable`, {}, {
    default: "Second variable",
  });
  const averageAria = t(`${M}.aria.variablesForAverage`, {}, {
    default: "Variables for average",
  });

  const operationLabel = t(`${M}.labels.operation`, {}, { default: "Operation" });
  const firstVarLabel = t(`${M}.labels.firstVariable`, {}, {
    default: "First variable",
  });
  const secondVarLabel = t(`${M}.labels.secondVariable`, {}, {
    default: "Second variable",
  });
  const averageLabel = t(`${M}.labels.variablesForAverage`, {}, {
    default: "Select variable(s)",
  });

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
        [inputs?.name]: computeValue({
          var1: parseFloat(row[inputs?.variable1]),
          var2: parseFloat(row[inputs?.variable2]),
          row,
          selectedVariables: Array.isArray(inputs?.selectedVariables)
            ? inputs.selectedVariables
            : [],
          operation: inputs?.operation,
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

  const operationValue =
    inputs?.operation && inputs.operation !== "zeroState"
      ? inputs.operation
      : "";

  const var1Value =
    inputs?.variable1 != null && inputs.variable1 !== ""
      ? String(inputs.variable1)
      : "";

  const var2Value =
    inputs?.variable2 != null && inputs.variable2 !== ""
      ? String(inputs.variable2)
      : "";

  const selectedForAverage = Array.isArray(inputs?.selectedVariables)
    ? inputs.selectedVariables.map(String)
    : [];

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
        <label>{operationLabel}</label>
        <DropdownSelect
          ariaLabel={operationAria}
          placeholder={operationPlaceholder}
          value={operationValue}
          onChange={(next) =>
            handleChange({
              target: { name: "operation", value: next },
            })
          }
          options={operationSelectOptions}
          searchableSingle
        />
        {(inputs?.operation === "add" ||
          inputs?.operation === "subtract" ||
          inputs?.operation === "multiply" ||
          inputs?.operation === "divide") && (
          <div>
            <label>{firstVarLabel}</label>
            <DropdownSelect
              ariaLabel={firstVarAria}
              placeholder={variablePlaceholder}
              value={var1Value}
              onChange={(next) =>
                handleChange({
                  target: { name: "variable1", value: next },
                })
              }
              options={variableSelectOptions}
              searchableSingle
            />

            <label>{secondVarLabel}</label>
            <DropdownSelect
              ariaLabel={secondVarAria}
              placeholder={variablePlaceholder}
              value={var2Value}
              onChange={(next) =>
                handleChange({
                  target: { name: "variable2", value: next },
                })
              }
              options={variableSelectOptions}
              searchableSingle
            />
          </div>
        )}
        {inputs?.operation === "average" && (
          <div>
            <label>{averageLabel}</label>
            <DropdownSelect
              multiple
              ariaLabel={averageAria}
              placeholder={variablesMultiPlaceholder}
              value={selectedForAverage}
              onChange={(next) =>
                handleChange({
                  target: {
                    name: "selectedVariables",
                    value: next,
                  },
                })
              }
              options={variableSelectOptions}
            />
          </div>
        )}
      </fieldset>
    </StyledForm>
  );
}
