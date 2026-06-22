import { useEffect, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import {
  CURRICULUM_TYPES,
  normalizeCurriculumType,
} from "../../../../lib/curriculumTypes";

export default function CurriculumTypeSelector({
  curriculumType,
  disabled,
  onChange,
}) {
  const { t } = useTranslation("classes");
  const [selection, setSelection] = useState(
    normalizeCurriculumType(curriculumType)
  );

  useEffect(() => {
    setSelection(normalizeCurriculumType(curriculumType));
  }, [curriculumType]);

  const handleSelect = (value) => {
    setSelection(value);
    onChange(value);
  };

  return (
    <fieldset className="curriculumTypeSelector">
      <legend className="curriculumTypeLegend">
        {t("curriculumTypeQuestion", {}, {
          default:
            "Which curriculum type applies to project boards in this class?",
        })}
      </legend>
      <p id="curriculumTypeHelp" className="curriculumTypeHelp">
        {t("curriculumTypeMentorNote", {}, {
          default:
            "This determines the mentor feedback questionnaire used in the feedback center. If you have questions, contact a MindHive team member.",
        })}
      </p>
      <div
        className="curriculumTypeOptions"
        role="radiogroup"
        aria-labelledby="curriculumTypeHelp"
      >
        {CURRICULUM_TYPES.map((type) => {
          const isSelected = selection === type.value;
          const inputId = `curriculum-type-${type.value}`;

          return (
            <label
              key={type.value}
              htmlFor={inputId}
              className={`curriculumTypeOption ${isSelected ? "curriculumTypeOptionSelected" : ""}`}
            >
              <input
                type="radio"
                id={inputId}
                name="curriculumType"
                value={type.value}
                checked={isSelected}
                disabled={disabled}
                onChange={() => handleSelect(type.value)}
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
