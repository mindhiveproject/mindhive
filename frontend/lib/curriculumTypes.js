export const DEFAULT_CURRICULUM_TYPE = "mindhive";

export const CURRICULUM_TYPES = [
  {
    value: "mindhive",
    logo: "/logo.png",
    labelKey: "curriculumTypeMindHive",
    defaultLabel: "MindHive",
  },
  {
    value: "youquantified",
    logo: "/logo_yq.svg",
    labelKey: "curriculumTypeYouQuantified",
    defaultLabel: "YouQuantified",
  },
  {
    value: "nyu_cusp",
    logo: "/assets/externalLogos/nyu_cusp.png",
    labelKey: "curriculumTypeNyuCusp",
    defaultLabel: "NYU CUSP (Capstone)",
  },
];

const VALID_CURRICULUM_TYPES = new Set(
  CURRICULUM_TYPES.map((type) => type.value)
);

const NYU_CUSP = "nyu_cusp";

function isValidCurriculumType(value) {
  return typeof value === "string" && VALID_CURRICULUM_TYPES.has(value);
}

export function normalizeCurriculumTypes(value) {
  const raw = Array.isArray(value)
    ? value
    : value != null && value !== ""
      ? [value]
      : [];
  const unique = [];
  const seen = new Set();
  for (const item of raw) {
    if (isValidCurriculumType(item) && !seen.has(item)) {
      seen.add(item);
      unique.push(item);
    }
  }
  return unique.length > 0 ? unique : [DEFAULT_CURRICULUM_TYPE];
}

export function normalizeCurriculumType(value) {
  if (Array.isArray(value)) {
    return normalizeCurriculumTypes(value)[0];
  }
  if (isValidCurriculumType(value)) {
    return value;
  }
  return DEFAULT_CURRICULUM_TYPE;
}

export function getClassCurriculumTypes(settings) {
  if (
    settings &&
    Array.isArray(settings.curriculumTypes) &&
    settings.curriculumTypes.length > 0
  ) {
    return normalizeCurriculumTypes(settings.curriculumTypes);
  }
  return normalizeCurriculumTypes(settings?.curriculumType);
}

export function getClassCurriculumFallback(types) {
  const normalized = normalizeCurriculumTypes(types);
  if (normalized.includes(DEFAULT_CURRICULUM_TYPE)) {
    return DEFAULT_CURRICULUM_TYPE;
  }
  return normalized[0];
}

export function classHasNyuCusp(settings) {
  return getClassCurriculumTypes(settings).includes(NYU_CUSP);
}

export function classIsNyuCuspOnly(settings) {
  const types = getClassCurriculumTypes(settings);
  return types.length === 1 && types[0] === NYU_CUSP;
}

export function getCurriculumType(project) {
  const fromBoard = project?.settings?.curriculumType;
  if (isValidCurriculumType(fromBoard)) {
    return fromBoard;
  }
  if (Array.isArray(fromBoard)) {
    return normalizeCurriculumTypes(fromBoard)[0];
  }

  const classSettings = project?.usedInClass?.settings;
  if (classSettings) {
    return getClassCurriculumFallback(getClassCurriculumTypes(classSettings));
  }

  return DEFAULT_CURRICULUM_TYPE;
}

export function mergeReviewContentWithTemplate(savedContent, templateContent) {
  if (!Array.isArray(templateContent)) {
    return savedContent || [];
  }
  if (!Array.isArray(savedContent) || savedContent.length === 0) {
    return templateContent;
  }

  const savedByName = new Map(
    savedContent.map((item) => [item?.name, item])
  );

  return templateContent.map((templateItem) => {
    const savedItem = savedByName.get(templateItem.name);
    if (!savedItem) {
      return templateItem;
    }
    return {
      ...templateItem,
      answer: savedItem.answer ?? "",
      ...(savedItem.rating != null ? { rating: savedItem.rating } : {}),
    };
  });
}
