// Helpers for building Review FormDefinition seed payloads. Answers are
// stored in Review.content (json_bucket key "content").
//
// Field types mirror the legacy Template.js review questionnaires:
// textarea, select_one_icon, task_selector, dual_textarea.

// Kinds are lowercase snake_case to match milestone reviewStage values
// (slugifyMilestoneKey lowercases titles by default). Keeps composed
// keys like `review_peer_review_mindhive` uniform across seed / template
// / manual admin flows.
export type ReviewFormKind =
  | "submitted_as_proposal"
  | "peer_review"
  | "project_report";

export type ReviewCurriculum = "mindhive" | "youquantified" | "nyu_cusp";

export type I18nBag = Record<string, string>;

export type SelectOneIconOption = {
  value: string;
  label: string;
  labelI18n?: I18nBag;
  icon: string;
  subtitle: string;
  subtitleI18n?: I18nBag;
  order?: number;
};

export type FieldSeed = {
  name: string;
  fieldType: string;
  label: string;
  labelI18n?: I18nBag;
  helperText?: string;
  helperTextI18n?: I18nBag;
  placeholder?: string;
  isRequired?: boolean;
  storage: "json_bucket";
  storageBucket: "content";
  options?: SelectOneIconOption[];
  validation?: Record<string, unknown>;
};

export type CardSeed = {
  title: string;
  description?: string;
  cardType?: "fields";
  fields?: FieldSeed[];
};

export type FormSeed = {
  key: string;
  title: string;
  description: string;
  cards: CardSeed[];
};

const REVIEW_STORAGE = {
  storage: "json_bucket" as const,
  storageBucket: "content" as const,
};

export function reviewFormKey(
  kind: ReviewFormKind,
  curriculum: ReviewCurriculum
): string {
  return `review_${kind}_${curriculum}`;
}

export function reviewI18nKey(curriculumI18nPrefix: string, key: string): string {
  return `reviewTemplate.${curriculumI18nPrefix}.${key}`;
}

export function enI18n(text: string, i18nKey?: string): I18nBag {
  const bag: I18nBag = { en: text };
  if (i18nKey) bag.i18nKey = i18nKey;
  return bag;
}

function baseField(
  name: string,
  fieldType: string,
  label: string,
  labelI18nKey?: string,
  extra: Partial<FieldSeed> = {}
): FieldSeed {
  return {
    name,
    fieldType,
    label,
    labelI18n: enI18n(label, labelI18nKey),
    ...REVIEW_STORAGE,
    ...extra,
  };
}

export function fieldTextarea(
  name: string,
  label: string,
  labelI18nKey: string,
  helperText = "",
  helperI18nKey?: string
): FieldSeed {
  return baseField(name, "textarea", label, labelI18nKey, {
    helperText,
    helperTextI18n: helperText
      ? enI18n(helperText, helperI18nKey)
      : undefined,
  });
}

export function fieldSelectOneIcon(
  name: string,
  label: string,
  labelI18nKey: string,
  options: SelectOneIconOption[]
): FieldSeed {
  return baseField(name, "select_one_icon", label, labelI18nKey, {
    options: options.map((opt, index) => ({
      ...opt,
      order: opt.order ?? index,
      labelI18n: opt.labelI18n ?? enI18n(opt.label),
      subtitleI18n: opt.subtitleI18n ?? enI18n(opt.subtitle),
    })),
  });
}

export function fieldTaskSelector(name: string): FieldSeed {
  return baseField(name, "task_selector", "", undefined);
}

export function fieldDualTextarea(
  name: string,
  label: string,
  labelI18nKey: string,
  subLabelA: string,
  subLabelAI18nKey: string,
  subLabelB: string,
  subLabelBI18nKey: string
): FieldSeed {
  return baseField(name, "dual_textarea", label, labelI18nKey, {
    validation: {
      subLabelA,
      subLabelB,
      subLabelAI18n: enI18n(subLabelA, subLabelAI18nKey),
      subLabelBI18n: enI18n(subLabelB, subLabelBI18nKey),
    },
  });
}

export function buildReviewFormSeed({
  kind,
  curriculum,
  curriculumI18nPrefix,
  curriculumTitle,
  cards,
}: {
  kind: ReviewFormKind;
  curriculum: ReviewCurriculum;
  curriculumI18nPrefix: string;
  curriculumTitle: string;
  cards: CardSeed[];
}): FormSeed {
  const kindLabel =
    kind === "submitted_as_proposal"
      ? "Proposal review"
      : kind === "peer_review"
        ? "Peer review"
        : "Project report";

  return {
    key: reviewFormKey(kind, curriculum),
    title: `${kindLabel} — ${curriculumTitle}`,
    description:
      `Global review form for stage ${kind} (${curriculumTitle}). ` +
      `Answers are stored in Review.content. i18n keys live under ` +
      `reviewTemplate.${curriculumI18nPrefix}.* in builder.json.`,
    cards,
  };
}

export function reviewQuestionsCard(
  title: string,
  fields: FieldSeed[],
  description = ""
): CardSeed {
  return {
    title,
    description,
    cardType: "fields",
    fields,
  };
}

export function blankProjectReportSeed(
  curriculum: ReviewCurriculum,
  curriculumI18nPrefix: string,
  curriculumTitle: string
): FormSeed {
  return buildReviewFormSeed({
    kind: "project_report",
    curriculum,
    curriculumI18nPrefix,
    curriculumTitle,
    cards: [],
  });
}
