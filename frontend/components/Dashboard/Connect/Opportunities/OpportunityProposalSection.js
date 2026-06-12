import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import {
  asMultiselectArray,
  DATASET_PROVISION_OPTIONS,
  DELIVERABLE_OPTIONS,
  FIELD_RESEARCH_OPTIONS,
  HARDWARE_OPTIONS,
  INTERNSHIP_INTEREST_OPTIONS,
  PROPOSAL_WORD_LIMITS,
  SOFTWARE_OPTIONS,
  YES_NO_OPTIONS,
  toggleMultiselectValue,
} from "./OpportunityProposalConfig";

function RequiredMark() {
  return <span style={{ color: "#b3261e" }}> *</span>;
}

function WordHint({ value, max, t }) {
  const count = value
    ? String(value)
        .replace(/<[^>]+>/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    : 0;
  const over = count > max;
  return (
    <span
      className="hint"
      style={{ color: over ? "#b3261e" : "#888", fontSize: 11 }}
    >
      {t("opportunityEditor.wordCountTemplate", { count, max }, {
        default: "{{count}} / {{max}} words",
      })}{" "}
      {over
        ? t("opportunityEditor.wordCountOver", {}, { default: "— consider trimming" })
        : ""}
    </span>
  );
}

function translateOptions(t, prefix, options) {
  return options.map((opt) => ({
    value: opt.value,
    label: t(`${prefix}.${opt.labelKey}`, {}, { default: opt.labelKey }),
  }));
}

function MultiDropdownField({
  t,
  labelKey,
  hintKey,
  required,
  options,
  optionPrefix,
  selected,
  onChange,
  disabled,
  placeholder,
  searchableMultiple = true,
}) {
  const translated = translateOptions(t, optionPrefix, options);
  return (
    <Field>
      <span className="label-text">
        {t(labelKey, {}, { default: labelKey })}
        {required ? <RequiredMark /> : null}
      </span>
      {hintKey ? (
        <span className="hint">
          {t(hintKey, {}, { default: "" })}
        </span>
      ) : null}
      <DropdownSelect
        multiple
        value={selected}
        options={translated}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        ariaLabel={t(labelKey, {}, { default: labelKey })}
        searchableMultiple={searchableMultiple}
      />
    </Field>
  );
}

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: "Lato", sans-serif;
  font-size: 14px;
  color: #5f6871;

  span.label-text {
    font-weight: 600;
    color: #171717;
  }

  span.hint {
    color: #888;
    font-size: 12px;
  }

  input[type="text"],
  textarea {
    padding: 10px 14px;
    border: 1px solid #d3dae0;
    border-radius: 12px;
    background: #ffffff;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    color: #171717;
    outline: none;

    &:focus {
      border-color: #336f8a;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  textarea {
    min-height: 120px;
    resize: vertical;
  }
`;

export default function OpportunityProposalSection({
  inputs,
  handleChange,
  handleMultipleUpdate,
  disabled = false,
}) {
  const { t } = useTranslation("connect");
  const ns = "opportunityEditor.overview";

  const yesNoOptions = translateOptions(t, `${ns}.yesNo`, YES_NO_OPTIONS);
  const fieldResearchOptions = translateOptions(
    t,
    `${ns}.fieldResearchOptions`,
    FIELD_RESEARCH_OPTIONS,
  );
  const internshipOptions = translateOptions(
    t,
    `${ns}.internshipInterestOptions`,
    INTERNSHIP_INTEREST_OPTIONS,
  );

  const multiSelectPlaceholder = t(`${ns}.multiSelectPlaceholder`, {}, {
    default: "Select all that apply",
  });

  const handleMultiselectChange = (field, exclusiveValue = null) => (next) => {
    if (!exclusiveValue) {
      handleMultipleUpdate({ [field]: next });
      return;
    }
    const current = asMultiselectArray(inputs[field]);
    const added = next.find((v) => !current.includes(v));
    const removed = current.find((v) => !next.includes(v));
    if (added) {
      handleMultipleUpdate({
        [field]: toggleMultiselectValue(current, added, exclusiveValue),
      });
    } else if (removed) {
      handleMultipleUpdate({
        [field]: toggleMultiselectValue(current, removed, exclusiveValue),
      });
    }
  };

  return (
    <>
      <Field>
        <span className="label-text">
          {t(`${ns}.projectTitle`, {}, { default: "Project Title" })}
          <RequiredMark />
        </span>
        <span className="hint">
          {t(`${ns}.projectTitleHint`, {}, {
            default: "Please limit to 15 words or fewer; shorter titles are preferred.",
          })}
        </span>
        <input
          type="text"
          name="title"
          value={inputs.title}
          onChange={handleChange}
          disabled={disabled}
        />
        <WordHint value={inputs.title} max={PROPOSAL_WORD_LIMITS.title} t={t} />
      </Field>

      <Field>
        <span className="label-text">
          {t(`${ns}.projectDescription`, {}, { default: "Project Description" })}
          <RequiredMark />
        </span>
        <span className="hint">
          {t(`${ns}.projectDescriptionHint`, {}, {
            default:
              "Please describe your proposed project (goals and intended outcomes) including the challenge(s) it addresses. (250 words)",
          })}
        </span>
        <textarea
          name="description"
          value={inputs.description}
          onChange={handleChange}
          disabled={disabled}
        />
        <WordHint
          value={inputs.description}
          max={PROPOSAL_WORD_LIMITS.description}
          t={t}
        />
      </Field>

      <Field>
        <span className="label-text">
          {t(`${ns}.relevance`, {}, { default: "Relevance to CUSP" })}
          <RequiredMark />
        </span>
        <span className="hint">
          {t(`${ns}.relevanceHint`, {}, {
            default:
              "Please describe how this project is well-suited to CUSP's urban focus and leverages the skills of the M.S. in Urban Data Science cohort. (250 words)",
          })}
        </span>
        <textarea
          name="relevance"
          value={inputs.relevance}
          onChange={handleChange}
          disabled={disabled}
        />
        <WordHint value={inputs.relevance} max={PROPOSAL_WORD_LIMITS.relevance} t={t} />
      </Field>

      <Field>
        <span className="label-text">
          {t(`${ns}.requiresSpecialResources`, {}, {
            default:
              "Does this project require any specialized hardware, software, or other resources not otherwise available through NYU?",
          })}
          <RequiredMark />
        </span>
        <span className="hint">
          {t(`${ns}.requiresSpecialResourcesHint`, {}, {
            default:
              "For example, Raspberry Pi devices or specialized sensors. A list of software packages available to NYU students can be found here.",
          })}
        </span>
        <DropdownSelect
          value={inputs.requiresSpecialResources || undefined}
          options={yesNoOptions}
          onChange={(value) =>
            handleMultipleUpdate({ requiresSpecialResources: value })
          }
          disabled={disabled}
          placeholder={t(`${ns}.selectPlaceholder`, {}, { default: "Select one" })}
          ariaLabel={t(`${ns}.requiresSpecialResources`, {}, {
            default: "Specialized resources required",
          })}
        />
      </Field>

      {inputs.requiresSpecialResources === "yes" && (
        <Field>
          <span className="label-text">
            {t(`${ns}.specialResourcesNotes`, {}, {
              default:
                "If yes, please describe the hardware, software, or other resources your organization will provide.",
            })}
          </span>
          <textarea
            name="specialResourcesNotes"
            value={inputs.specialResourcesNotes}
            onChange={handleChange}
            disabled={disabled}
          />
        </Field>
      )}

      <MultiDropdownField
        t={t}
        labelKey={`${ns}.datasetProvision`}
        hintKey={`${ns}.datasetProvisionHint`}
        required
        options={DATASET_PROVISION_OPTIONS}
        optionPrefix={`${ns}.datasetProvisionOptions`}
        selected={inputs.datasetProvision}
        onChange={handleMultiselectChange("datasetProvision")}
        disabled={disabled}
        placeholder={multiSelectPlaceholder}
        searchableMultiple={false}
      />

      {inputs.datasetProvision.includes("other") && (
        <Field>
          <span className="label-text">
            {t(`${ns}.datasetProvisionOther`, {}, { default: "Other (datasets)" })}
          </span>
          <input
            type="text"
            name="datasetProvisionOther"
            value={inputs.datasetProvisionOther}
            onChange={handleChange}
            disabled={disabled}
          />
        </Field>
      )}

      <MultiDropdownField
        t={t}
        labelKey={`${ns}.expectedDeliverables`}
        hintKey={`${ns}.expectedDeliverablesHint`}
        required
        options={DELIVERABLE_OPTIONS}
        optionPrefix={`${ns}.deliverableOptions`}
        selected={inputs.expectedDeliverables}
        onChange={handleMultiselectChange("expectedDeliverables")}
        disabled={disabled}
        placeholder={multiSelectPlaceholder}
      />

      {inputs.expectedDeliverables.includes("other") && (
        <Field>
          <span className="label-text">
            {t(`${ns}.expectedDeliverablesOther`, {}, { default: "Other (deliverables)" })}
          </span>
          <input
            type="text"
            name="expectedDeliverablesOther"
            value={inputs.expectedDeliverablesOther}
            onChange={handleChange}
            disabled={disabled}
          />
        </Field>
      )}

      <Field>
        <span className="label-text">
          {t(`${ns}.anticipatedObstacles`, {}, {
            default:
              "Do you anticipate any obstacles the capstone student team might encounter while working on this project?",
          })}
          <RequiredMark />
        </span>
        <span className="hint">
          {t(`${ns}.anticipatedObstaclesHint`, {}, {
            default:
              "This may include issues such as incomplete datasets or datasets requiring significant cleaning; limited stakeholder buy-in; organizational changes or staffing transitions. (100 words)",
          })}
        </span>
        <textarea
          name="anticipatedObstacles"
          value={inputs.anticipatedObstacles}
          onChange={handleChange}
          disabled={disabled}
        />
        <WordHint
          value={inputs.anticipatedObstacles}
          max={PROPOSAL_WORD_LIMITS.anticipatedObstacles}
          t={t}
        />
      </Field>

      <Field>
        <span className="label-text">
          {t(`${ns}.fieldResearchRequired`, {}, {
            default:
              "Will the capstone student team be expected to conduct field research, site visits, or travel to locations beyond the primary client site to complete the project?",
          })}
          <RequiredMark />
        </span>
        <DropdownSelect
          value={inputs.fieldResearchRequired || undefined}
          options={fieldResearchOptions}
          onChange={(value) =>
            handleMultipleUpdate({ fieldResearchRequired: value })
          }
          disabled={disabled}
          placeholder={t(`${ns}.selectPlaceholder`, {}, { default: "Select one" })}
          ariaLabel={t(`${ns}.fieldResearchRequired`, {}, {
            default: "Field research required",
          })}
        />
      </Field>

      {inputs.fieldResearchRequired === "yes" && (
        <Field>
          <span className="label-text">
            {t(`${ns}.fieldResearchTravelDetails`, {}, {
              default:
                "If yes, please describe the anticipated locations and any associated travel requirements.",
            })}
          </span>
          <textarea
            name="fieldResearchTravelDetails"
            value={inputs.fieldResearchTravelDetails}
            onChange={handleChange}
            disabled={disabled}
          />
        </Field>
      )}

      <MultiDropdownField
        t={t}
        labelKey={`${ns}.requiredSoftware`}
        hintKey={`${ns}.requiredSoftwareHint`}
        required
        options={SOFTWARE_OPTIONS}
        optionPrefix={`${ns}.softwareOptions`}
        selected={inputs.requiredSoftware}
        onChange={handleMultiselectChange("requiredSoftware", "team_discretion")}
        disabled={disabled}
        placeholder={multiSelectPlaceholder}
      />

      {inputs.requiredSoftware.includes("other") && (
        <Field>
          <span className="label-text">
            {t(`${ns}.requiredSoftwareOther`, {}, { default: "Other (software)" })}
          </span>
          <input
            type="text"
            name="requiredSoftwareOther"
            value={inputs.requiredSoftwareOther}
            onChange={handleChange}
            disabled={disabled}
          />
        </Field>
      )}

      <MultiDropdownField
        t={t}
        labelKey={`${ns}.requiredHardware`}
        hintKey={`${ns}.requiredHardwareHint`}
        required
        options={HARDWARE_OPTIONS}
        optionPrefix={`${ns}.hardwareOptions`}
        selected={inputs.requiredHardware}
        onChange={handleMultiselectChange("requiredHardware", "team_discretion")}
        disabled={disabled}
        placeholder={multiSelectPlaceholder}
        searchableMultiple={false}
      />

      {inputs.requiredHardware.includes("other") && (
        <Field>
          <span className="label-text">
            {t(`${ns}.requiredHardwareOther`, {}, { default: "Other (hardware)" })}
          </span>
          <input
            type="text"
            name="requiredHardwareOther"
            value={inputs.requiredHardwareOther}
            onChange={handleChange}
            disabled={disabled}
          />
        </Field>
      )}

      <Field>
        <span className="label-text">
          {t(`${ns}.additionalNotes`, {}, {
            default:
              "Please describe any additional considerations the CUSP capstone team should be aware of, if applicable.",
          })}
        </span>
        <span className="hint">
          {t(`${ns}.additionalNotesHint`, {}, {
            default:
              "This may include data privacy restrictions and security requirements, NDA agreements, IRB approval, data access limitations, stakeholder coordination, or other constraints.",
          })}
        </span>
        <textarea
          name="additionalNotes"
          value={inputs.additionalNotes}
          onChange={handleChange}
          disabled={disabled}
        />
      </Field>

      <Field>
        <span className="label-text">
          {t(`${ns}.internshipInterest`, {}, {
            default:
              "If not selected, would you be interested in converting your application as an unpaid or paid internship?",
          })}
        </span>
        <DropdownSelect
          value={inputs.internshipInterest || undefined}
          options={internshipOptions}
          onChange={(value) => handleMultipleUpdate({ internshipInterest: value })}
          disabled={disabled}
          placeholder={t(`${ns}.selectPlaceholder`, {}, { default: "Select one" })}
          ariaLabel={t(`${ns}.internshipInterest`, {}, {
            default: "Internship interest",
          })}
        />
      </Field>
    </>
  );
}
