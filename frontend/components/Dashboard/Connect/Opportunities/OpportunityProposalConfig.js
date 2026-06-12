/** Option values for the unified "Overview of Capstone Project Proposal" section (temp.md). */

export const YES_NO_OPTIONS = [
  { value: "yes", labelKey: "yes" },
  { value: "no", labelKey: "no" },
];

export const DATASET_PROVISION_OPTIONS = [
  { value: "public", labelKey: "public" },
  { value: "org_no_restrictions", labelKey: "orgNoRestrictions" },
  { value: "org_privacy_nda", labelKey: "orgPrivacyNda" },
  { value: "other", labelKey: "other" },
];

export const FIELD_RESEARCH_OPTIONS = [
  { value: "yes", labelKey: "yes" },
  { value: "no", labelKey: "no" },
  { value: "beneficial", labelKey: "beneficial" },
];

export const INTERNSHIP_INTEREST_OPTIONS = [
  { value: "yes", labelKey: "yes" },
  { value: "no", labelKey: "no" },
  { value: "maybe", labelKey: "maybe" },
];

export const DELIVERABLE_OPTIONS = [
  { value: "academic_paper", labelKey: "academicPaper" },
  { value: "algorithm_development", labelKey: "algorithmDevelopment" },
  { value: "data_visualizations", labelKey: "dataVisualizations" },
  { value: "github_repository", labelKey: "githubRepository" },
  { value: "interactive_dashboard", labelKey: "interactiveDashboard" },
  { value: "literature_review", labelKey: "literatureReview" },
  { value: "machine_learning_model", labelKey: "machineLearningModel" },
  { value: "policy_memo", labelKey: "policyMemo" },
  { value: "policy_recommendations", labelKey: "policyRecommendations" },
  { value: "project_website", labelKey: "projectWebsite" },
  { value: "survey_evaluation_tools", labelKey: "surveyEvaluationTools" },
  { value: "technical_report", labelKey: "technicalReport" },
  { value: "web_application", labelKey: "webApplication" },
  { value: "other", labelKey: "other" },
];

export const SOFTWARE_OPTIONS = [
  { value: "team_discretion", labelKey: "teamDiscretion" },
  { value: "python", labelKey: "python" },
  { value: "r", labelKey: "r" },
  { value: "r_shiny", labelKey: "rShiny" },
  { value: "sql", labelKey: "sql" },
  { value: "postgresql_postgis", labelKey: "postgresqlPostgis" },
  { value: "qgis", labelKey: "qgis" },
  { value: "arcgis", labelKey: "arcgis" },
  { value: "tableau", labelKey: "tableau" },
  { value: "power_bi", labelKey: "powerBi" },
  { value: "jupyter", labelKey: "jupyter" },
  { value: "github", labelKey: "github" },
  { value: "docker", labelKey: "docker" },
  { value: "apache_spark", labelKey: "apacheSpark" },
  { value: "databricks", labelKey: "databricks" },
  { value: "google_earth_engine", labelKey: "googleEarthEngine" },
  { value: "geopandas", labelKey: "geopandas" },
  { value: "javascript", labelKey: "javascript" },
  { value: "snowflake", labelKey: "snowflake" },
  { value: "tensorflow", labelKey: "tensorflow" },
  { value: "pytorch", labelKey: "pytorch" },
  { value: "llm_genai", labelKey: "llmGenai" },
  { value: "computer_vision", labelKey: "computerVision" },
  { value: "nlp", labelKey: "nlp" },
  { value: "other", labelKey: "other" },
];

export const HARDWARE_OPTIONS = [
  { value: "team_discretion", labelKey: "teamDiscretion" },
  { value: "microcontrollers", labelKey: "microcontrollers" },
  { value: "sensors", labelKey: "sensors" },
  { value: "cameras_cv", labelKey: "camerasCv" },
  { value: "gpu_access", labelKey: "gpuAccess" },
  { value: "other", labelKey: "other" },
];

export const PROPOSAL_WORD_LIMITS = {
  title: 15,
  description: 250,
  relevance: 250,
  anticipatedObstacles: 100,
};

/** Fields stored in Opportunity.proposalData (title/description are top-level). */
export const PROPOSAL_DATA_EMPTY = {
  relevance: "",
  requiresSpecialResources: "",
  specialResourcesNotes: "",
  datasetProvision: [],
  datasetProvisionOther: "",
  expectedDeliverables: [],
  expectedDeliverablesOther: "",
  anticipatedObstacles: "",
  fieldResearchRequired: "",
  fieldResearchTravelDetails: "",
  requiredSoftware: [],
  requiredSoftwareOther: "",
  requiredHardware: [],
  requiredHardwareOther: "",
  additionalNotes: "",
  internshipInterest: "",
};

export const PROPOSAL_EMPTY_FORM = {
  title: "",
  description: "",
  ...PROPOSAL_DATA_EMPTY,
};

/** Build the JSON blob persisted on Opportunity.proposalData. */
export function buildProposalData(inputs) {
  return {
    relevance: inputs.relevance || "",
    requiresSpecialResources: inputs.requiresSpecialResources || "",
    specialResourcesNotes: inputs.specialResourcesNotes || "",
    datasetProvision: inputs.datasetProvision || [],
    datasetProvisionOther: inputs.datasetProvisionOther || "",
    expectedDeliverables: inputs.expectedDeliverables || [],
    expectedDeliverablesOther: inputs.expectedDeliverablesOther || "",
    anticipatedObstacles: inputs.anticipatedObstacles || "",
    fieldResearchRequired: inputs.fieldResearchRequired || "",
    fieldResearchTravelDetails: inputs.fieldResearchTravelDetails || "",
    requiredSoftware: inputs.requiredSoftware || [],
    requiredSoftwareOther: inputs.requiredSoftwareOther || "",
    requiredHardware: inputs.requiredHardware || [],
    requiredHardwareOther: inputs.requiredHardwareOther || "",
    additionalNotes: inputs.additionalNotes || "",
    internshipInterest: inputs.internshipInterest || "",
  };
}

/** Parse proposalData JSON (or legacy flat opportunity fields) into form inputs. */
export function hydrateProposalInputs(opportunity) {
  if (!opportunity) return { ...PROPOSAL_DATA_EMPTY };

  const raw =
    opportunity.proposalData && typeof opportunity.proposalData === "object"
      ? opportunity.proposalData
      : opportunity;

  return {
    relevance:
      raw.relevance ||
      opportunity.issueRelevance ||
      "",
    requiresSpecialResources: raw.requiresSpecialResources || "",
    specialResourcesNotes: raw.specialResourcesNotes || "",
    datasetProvision: asLegacyMultiselectArray(raw.datasetProvision),
    datasetProvisionOther: raw.datasetProvisionOther || "",
    expectedDeliverables: asMultiselectArray(raw.expectedDeliverables),
    expectedDeliverablesOther: raw.expectedDeliverablesOther || "",
    anticipatedObstacles: raw.anticipatedObstacles || "",
    fieldResearchRequired: raw.fieldResearchRequired || "",
    fieldResearchTravelDetails: raw.fieldResearchTravelDetails || "",
    requiredSoftware: asMultiselectArray(raw.requiredSoftware),
    requiredSoftwareOther: raw.requiredSoftwareOther || "",
    requiredHardware: asMultiselectArray(raw.requiredHardware),
    requiredHardwareOther: raw.requiredHardwareOther || "",
    additionalNotes:
      raw.additionalNotes ||
      opportunity.specialConsiderations ||
      "",
    internshipInterest: raw.internshipInterest || "",
  };
}

/** Normalize Keystone multiselect values (array or JSON string). */
export function asMultiselectArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Like asMultiselectArray, but accepts legacy single-string select values. */
export function asLegacyMultiselectArray(value) {
  const parsed = asMultiselectArray(value);
  if (parsed.length) return parsed;
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

/** Toggle a value in a multiselect; `team_discretion` is exclusive. */
export function toggleMultiselectValue(current, value, exclusiveValue = null) {
  const list = asMultiselectArray(current);
  if (exclusiveValue && value === exclusiveValue) {
    return list.includes(exclusiveValue) ? [] : [exclusiveValue];
  }
  const withoutExclusive = exclusiveValue
    ? list.filter((v) => v !== exclusiveValue)
    : list;
  if (withoutExclusive.includes(value)) {
    return withoutExclusive.filter((v) => v !== value);
  }
  return [...withoutExclusive, value];
}
