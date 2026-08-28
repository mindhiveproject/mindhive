import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import useTranslation from "next-translate/useTranslation";

import {
  CURRICULUM_TYPES,
  normalizeCurriculumType,
  normalizeCurriculumTypes,
} from "../../../../lib/curriculumTypes";

export default function CurriculumTypeSelector({
  curriculumType,
  disabled,
  onChange,
  multiple = false,
  allowedValues,
  questionKey = "curriculumTypeQuestion",
  questionDefault =
    "Which curriculum type applies to project boards in this class?",
}) {
  const { t } = useTranslation("classes");
  const [selection, setSelection] = useState(() =>
    multiple
      ? normalizeCurriculumTypes(curriculumType)
      : normalizeCurriculumType(curriculumType)
  );

  useEffect(() => {
    setSelection(
      multiple
        ? normalizeCurriculumTypes(curriculumType)
        : normalizeCurriculumType(curriculumType)
    );
  }, [curriculumType, multiple]);

  const typesToShow = useMemo(() => {
    if (!allowedValues?.length) return CURRICULUM_TYPES;

    const allowed = new Set(allowedValues);
    const listed = CURRICULUM_TYPES.filter((type) => allowed.has(type.value));
    const currentValues = multiple
      ? Array.isArray(selection)
        ? selection
        : []
      : selection
        ? [selection]
        : [];
    const extras = CURRICULUM_TYPES.filter(
      (type) =>
        currentValues.includes(type.value) && !allowed.has(type.value)
    );
    return extras.length ? [...listed, ...extras] : listed;
  }, [allowedValues, multiple, selection]);

  const handleSelect = (value) => {
    setSelection(value);
    onChange(value);
  };

  const handleToggle = (value) => {
    const current = Array.isArray(selection)
      ? selection
      : normalizeCurriculumTypes(selection);
    const isSelected = current.includes(value);
    if (isSelected) {
      const next = current.filter((item) => item !== value);
      if (next.length === 0) return;
      const normalized = normalizeCurriculumTypes(next);
      setSelection(normalized);
      onChange(normalized);
      return;
    }
    const normalized = normalizeCurriculumTypes([...current, value]);
    setSelection(normalized);
    onChange(normalized);
  };

  const selectedSet = useMemo(() => {
    if (multiple) {
      return new Set(
        Array.isArray(selection) ? selection : normalizeCurriculumTypes(selection)
      );
    }
    return new Set([selection]);
  }, [multiple, selection]);

  const fieldName = multiple ? "curriculumTypes" : "curriculumType";

  return (
    <fieldset className="curriculumTypeSelector">
      <legend className="curriculumTypeLegend">
        {t(questionKey, {}, { default: questionDefault })}
      </legend>
      <p id="curriculumTypeHelp" className="curriculumTypeHelp">
        {/* TODO: Add help text */}
      </p>
      <div
        className="curriculumTypeOptions"
        role={multiple ? "group" : "radiogroup"}
        aria-labelledby="curriculumTypeHelp"
      >
        {typesToShow.map((type) => {
          const isSelected = selectedSet.has(type.value);
          const inputId = `${fieldName}-${type.value}`;

          return (
            <label
              key={type.value}
              htmlFor={inputId}
              className={clsx(
                "curriculumTypeOption",
                isSelected && "curriculumTypeOptionSelected"
              )}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                id={inputId}
                name={fieldName}
                value={type.value}
                checked={isSelected}
                disabled={disabled}
                onChange={() =>
                  multiple ? handleToggle(type.value) : handleSelect(type.value)
                }
                aria-describedby="curriculumTypeHelp"
              />
              <span className="curriculumTypeOptionContent">
                <img
                  src={type.logo}
                  alt=""
                  aria-hidden="true"
                  className="curriculumTypeLogo"
                />
                <span className="curriculumTypeLabel">
                  {t(type.labelKey, {}, { default: type.defaultLabel })}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
