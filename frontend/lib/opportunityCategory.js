/**
 * Opportunity.projectCategory select values and display helpers.
 * Labels resolve via connect i18n: opportunityEditor.categorizationOptions.*
 */

export const PROJECT_CATEGORY_ORDER = [
  "urban_health",
  "urban_environment",
  "urban_infrastructure",
  "other",
];

/** Maps schema enum → connect.opportunityEditor.categorizationOptions key */
export const PROJECT_CATEGORY_LABEL_KEYS = {
  urban_health: "urbanHealth",
  urban_environment: "urbanEnvironment",
  urban_infrastructure: "urbanInfrastructure",
  other: "other",
};

/**
 * @param {string|null|undefined} projectCategory
 * @param {string|null|undefined} projectCategoryOther
 * @param {(key: string, query?: object, options?: object) => string} tConnect
 *   Translator from useTranslation("connect")
 * @returns {string|null}
 */
export function getProjectCategoryDisplay(
  projectCategory,
  projectCategoryOther,
  tConnect,
) {
  const optionKey = PROJECT_CATEGORY_LABEL_KEYS[projectCategory];
  const categoryLabel = optionKey
    ? tConnect(
        `opportunityEditor.categorizationOptions.${optionKey}`,
        {},
        { default: projectCategory },
      )
    : projectCategory || null;

  if (categoryLabel) {
    if (projectCategory === "other" && projectCategoryOther) {
      return `${categoryLabel}: ${projectCategoryOther}`;
    }
    return categoryLabel;
  }

  return projectCategoryOther || null;
}

/**
 * Distinct projectCategory values from a list, in schema order.
 * @param {Array<{ projectCategory?: string|null }>} opportunities
 * @returns {string[]}
 */
export function getDistinctProjectCategories(opportunities) {
  const present = new Set();
  for (const opp of opportunities || []) {
    if (opp?.projectCategory) present.add(opp.projectCategory);
  }
  return PROJECT_CATEGORY_ORDER.filter((value) => present.has(value)).concat(
    [...present].filter((value) => !PROJECT_CATEGORY_ORDER.includes(value)),
  );
}
