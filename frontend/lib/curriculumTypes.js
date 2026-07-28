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

export function normalizeCurriculumType(value) {
  if (value && VALID_CURRICULUM_TYPES.has(value)) {
    return value;
  }
  return DEFAULT_CURRICULUM_TYPE;
}

export function getCurriculumType(project) {
  const fromBoard = project?.settings?.curriculumType;
  if (fromBoard && VALID_CURRICULUM_TYPES.has(fromBoard)) {
    return fromBoard;
  }

  const fromClass = project?.usedInClass?.settings?.curriculumType;
  if (fromClass && VALID_CURRICULUM_TYPES.has(fromClass)) {
    return fromClass;
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
