"use client";

import { useEffect, useMemo } from "react";

import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../../../../DesignSystem/DropdownSelect";
import { StyledForm } from "../../../../../../../styles/StyledForm";

const M = "dataJournal.datasetMenu.addColumnModal";

export default function Copy({
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

  const sourceVariableLabel = t(
    `${M}.labels.sourceVariable`,
    {},
    { default: "Select variable to copy" },
  );

  const variablePlaceholder = t(`${M}.placeholders.selectVariable`, {}, {
    default: "Select variable",
  });

  const variableAria = t(`${M}.aria.variableToCopy`, {}, {
    default: "Variable to copy",
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
        [inputs?.name]: row[inputs?.oldVariable],
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
      </fieldset>
    </StyledForm>
  );
}
